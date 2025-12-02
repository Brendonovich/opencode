import { copyBinaryToSidecarFolder, getCurrentSidecar } from "./utils";

const sidecarConfig = getCurrentSidecar();

await copyBinaryToSidecarFolder(`../opencode/dist/${sidecarConfig.ocBinary}/bin/opencode`)
