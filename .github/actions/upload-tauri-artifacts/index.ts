import { DefaultArtifactClient } from "@actions/artifact";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const BUNDLES_OUT_DIR = path.join(process.cwd(), `src-tauri/target/bundles`)

const artifactClient = new DefaultArtifactClient()

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


for (const bundle of bundles) {
  await artifactClient.uploadArtifact(bundle.name, bundle.files, BUNDLES_OUT_DIR)
}
