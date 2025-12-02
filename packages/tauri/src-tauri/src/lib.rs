use std::net::SocketAddr;
use std::process::Command;
use std::sync::{Arc, Mutex};

use tauri::{AppHandle, Manager, RunEvent};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogResult};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;
use tokio::net::TcpSocket;

#[derive(Clone)]
struct ServerState(Arc<Mutex<Option<CommandChild>>>);

fn opencode_port() -> u16 {
    option_env!("OPENCODE_PORT")
        .map(|s| s.to_string())
        .or_else(|| std::env::var("OPENCODE_PORT").ok())
        .and_then(|port_str| port_str.parse().ok())
        .unwrap_or(4096)
}

fn find_and_kill_process_on_port(port: u16) -> Result<(), Box<dyn std::error::Error>> {
    // Find all listeners on the specified port
    let listeners = listeners::get_processes_by_port(port)?;

    if listeners.is_empty() {
        println!("No processes found listening on port {}", port);
        return Ok(());
    }

    for listener in listeners {
        let pid = listener.pid;
        println!("Found process {} listening on port {}", pid, port);

        // Kill the process using platform-appropriate command
        #[cfg(target_os = "windows")]
        {
            Command::new("taskkill")
                .args(["/F", "/PID", &pid.to_string()])
                .output()?;
        }

        #[cfg(not(target_os = "windows"))]
        {
            Command::new("kill")
                .args(["-9", &pid.to_string()])
                .output()?;
        }

        println!("Killed process {}", pid);
    }

    Ok(())
}

fn spawn_sidecar(app: &AppHandle, port: u16) -> CommandChild {
    let (mut rx, child) = app
        .shell()
        .sidecar("opencode")
        .unwrap()
        .args(["serve", &format!("--port={port}")])
        .spawn()
        .expect("Failed to spawn opencode");

    tauri::async_runtime::spawn(async move {
        // read events such as stdout
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line_bytes) => {
                    let line = String::from_utf8_lossy(&line_bytes);
                    print!("{line}");
                }
                CommandEvent::Stderr(line_bytes) => {
                    let line = String::from_utf8_lossy(&line_bytes);
                    eprint!("{line}");
                }
                _ => {}
            }
        }
    });

    child
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[tokio::main]
pub async fn run() {
    let port = opencode_port();
    let socket = TcpSocket::new_v4()
        .unwrap()
        .connect(SocketAddr::new(
            "127.0.0.1".parse().expect("Failed to parse IP"),
            port,
        ))
        .await;

    let socket_connected = socket.is_ok();

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|_, _, _| {}))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let app = app.handle().clone();

            let child = if socket_connected {
                let res = app
                    .dialog()
                    .message("OpenCode Server is already running, would you like to restart it?")
                    .buttons(MessageDialogButtons::YesNo)
                    .blocking_show_with_result();

                match res {
                    MessageDialogResult::Yes => {
                        if let Err(e) = find_and_kill_process_on_port(port) {
                            eprintln!("Failed to kill process on port {}: {}", port, e);
                        }
                        Some(spawn_sidecar(&app, port))
                    }
                    _ => None,
                }
            } else {
                Some(spawn_sidecar(&app, port))
            };

            app.manage(ServerState(Arc::new(Mutex::new(child))));

            Ok(())
        });

    if option_env!("TAURI_SIGNING_PRIVATE_KEY").is_some() {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app, event| {
            if let RunEvent::Exit = event {
                println!("Received Exit");

                let _ = app
                    .state::<ServerState>()
                    .0
                    .lock()
                    .expect("Failed to acquire mutex lock")
                    .take()
                    .expect("State not found")
                    .kill();

                println!("Killed server");
            }
        });
}
