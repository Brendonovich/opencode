import { $ } from "bun";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { RUST_TARGET } from "./utils";

if(!RUST_TARGET) throw new Error("RUST_TARGET not defined")

const BUNDLE_DIR = `src-tauri/target/${RUST_TARGET}/release/bundle`;
const BUNDLES_OUT_DIR = path.join(process.cwd(), `src-tauri/target/bundles`)

await $`mkdir -p ${BUNDLES_OUT_DIR}`

await $`cp -r ${BUNDLE_DIR}/*/OpenCode* ${BUNDLES_OUT_DIR}`

const bundles = await (async () => {
  const ret: {name: string, files: string[]}[] = [];

  const bundles = await fs.readdir(BUNDLES_OUT_DIR, { withFileTypes: true })

  for(const bundle of bundles) {
    let files: string[] = [];

    if(bundle.isDirectory()) {
      const bundleContents = fs.readdir(path.join(bundle.parentPath, bundle.name), { recursive: true, withFileTypes: true });
      const a = await bundleContents.then(ents => ents.filter(d => d.isFile()).map(ent => path.join(ent.parentPath, ent.name)));
      files.push(...a)
    } else {
      files.push(path.join(bundle.parentPath, bundle.name))
    }

    ret.push({name: bundle.name, files})
  }

  return ret
})();

console.log("Prepared bundles for publishing:", bundles)

if(Bun.env.GITHUB_ACTIONS) {
  const { DefaultArtifactClient } = await import("@actions/artifact")
  const artifactClient = new DefaultArtifactClient()

  for(const bundle of bundles) {
    await artifactClient.uploadArtifact(bundle.name, bundle.files, BUNDLES_OUT_DIR);
  }
}
