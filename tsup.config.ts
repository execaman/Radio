import { defineConfig } from "tsup";

export default defineConfig({
  bundle: true,
  cjsInterop: false,
  clean: true,
  dts: false,
  entry: ["src/index.ts"],
  format: "esm",
  minify: false,
  outDir: "app",
  platform: "node",
  removeNodeProtocol: false,
  silent: true,
  skipNodeModulesBundle: true,
  sourcemap: false,
  target: "esnext",
  treeshake: true,
  tsconfig: "tsconfig.json"
});
