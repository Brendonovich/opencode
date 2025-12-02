import solidPlugin from "vite-plugin-solid"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

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
            "@": path.resolve(new URL(import.meta.url).pathname, "../src"),
          },
        },
      }
    },
  },
  tailwindcss(),
  solidPlugin(),
]
