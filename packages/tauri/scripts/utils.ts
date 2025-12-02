import { $ } from "bun";

export const SIDECAR_BINARIES: Array<{ rustTarget: string; ocBinary: string, assetExt: string }> = [
  {
    rustTarget: "aarch64-apple-darwin",
    ocBinary: "opencode-darwin-arm64",
    assetExt: "zip"
  },
  {
    rustTarget: "x86_64-apple-darwin",
    ocBinary: "opencode-darwin-x64",
    assetExt: "zip"
  },
  {
    rustTarget: "x86_64-pc-windows-msvc",
    ocBinary: "opencode-windows-x64",
    assetExt: "zip"
  },
  {
    rustTarget: "x86_64-unknown-linux-gnu",
    ocBinary: "opencode-linux-x64",
    assetExt: "tar.gz"
  }
]

export const RUST_TARGET = Bun.env.RUST_TARGET

export function getCurrentSidecar() {
  if (!RUST_TARGET) throw new Error("RUST_TARGET not set")

  const binaryConfig = SIDECAR_BINARIES.find((b) => b.rustTarget === RUST_TARGET)
  if (!binaryConfig) throw new Error(`Sidecar configuration not available for Rust target '${RUST_TARGET}'`)

  return binaryConfig
}

export async function copyBinaryToSidecarFolder(source: string) {
  await $`mkdir -p src-tauri/binaries`
  await $`cp ${source} src-tauri/binaries/opencode-${RUST_TARGET}`
}
