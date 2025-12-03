import { $ } from "bun";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { RUST_TARGET } from "./utils";

if(!RUST_TARGET) throw new Error("RUST_TARGET not defined")

const BUNDLE_DIR = `src-tauri/target/${RUST_TARGET}/release/bundle`;
const BUNDLES_OUT_DIR = path.join(process.cwd(), `src-tauri/target/bundles`)

await $`mkdir -p ${BUNDLES_OUT_DIR}`

await $`cp -r ${BUNDLE_DIR}/*/OpenCode* ${BUNDLES_OUT_DIR}`

if(Bun.env.GITHUB_ACTIONS) {
  const { DefaultArtifactClient } = await import("@actions/artifact")
  const artifactClient = new DefaultArtifactClient()

  const bundles = await fs.readdir(BUNDLE_DIR)

  for(const bundle of bundles) {
    const files = await fs.readdir(bundle, { recursive: true, withFileTypes: true })
      .then(ents => ents.filter(d => d.isFile()).map(ent => path.join(ent.parentPath, ent.name)))

    await artifactClient.uploadArtifact(bundle, files, BUNDLES_OUT_DIR);
  }
}
