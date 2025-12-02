import solidPlugin from "vite-plugin-solid"
import tailwindcss from "@tailwindcss/vite"
import path from "path"
import { fileURLToPath } from "url"

/**
 * @type {import("vite").PluginOption}
 */
export default [
  {
    name: "opencode-desktop:config",
    config() {
      return {
        resolve: {
          alias: {
            "@": path.resolve(fileURLToPath(import.meta.url), "../src"),
          },
        },
      }
    },
  },
  tailwindcss(),
  solidPlugin(),
]
