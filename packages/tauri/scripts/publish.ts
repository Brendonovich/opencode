#!/usr/bin/env bun

import { $ } from "bun";

import { copyBinaryToSidecarFolder, getCurrentSidecar } from "./utils";

const sidecarConfig = getCurrentSidecar();

const dir = 'src-tauri/target/opencode-binaries';

await $`mkdir -p ${dir}`;
await $`gh release download --pattern ${sidecarConfig.ocBinary}.${sidecarConfig.assetExt} --repo sst/opencode --skip-existing --dir ${dir}`;
await $`unzip -o ${dir}/${sidecarConfig.ocBinary}.${sidecarConfig.assetExt} -d ${dir}`;

await copyBinaryToSidecarFolder(`${dir}/opencode`)
