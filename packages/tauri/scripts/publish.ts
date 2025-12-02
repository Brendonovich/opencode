#!/usr/bin/env bun

import { $ } from "bun";

import { copyBinaryToSidecarFolder, getCurrentSidecar } from "./utils";

const sidecarConfig = getCurrentSidecar();

const dir = 'src-tauri/target/opencode-binaries';

await $`mkdir -p ${dir}`;
await $`gh release download --pattern ${sidecarConfig.ocBinary}.zip --skip-existing --dir ${dir}`;
await $`unzip -o ${dir}/${sidecarConfig.ocBinary}.zip -d ${dir}`;

await copyBinaryToSidecarFolder(`${dir}/opencode`)
