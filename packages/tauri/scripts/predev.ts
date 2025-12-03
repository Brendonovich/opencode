import { copyBinaryToSidecarFolder, getCurrentSidecar } from "./utils";

const sidecarConfig = getCurrentSidecar(Bun.env.TAURI_ENV_TARGET_TRIPLE);

await copyBinaryToSidecarFolder(`../opencode/dist/${sidecarConfig.ocBinary}/bin/opencode`)
