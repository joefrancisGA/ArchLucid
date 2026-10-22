/**
 * Copies split UI-local openapi-typescript output into this package before `tsc`.
 * Keeps a single generation command on `archlucid-ui` (`npm run generate:api-types`).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const uiRoot = path.resolve(packageRoot, "..", "..");
const uiTypesDir = path.resolve(uiRoot, "src", "lib", "api-types");
const destDir = path.resolve(packageRoot, "src", "api-types");

function copyIfExists(relativePath) {
  const source = path.resolve(uiTypesDir, relativePath);
  const dest = path.resolve(destDir, relativePath);

  if (!fs.existsSync(source)) {
    console.error(`sync-from-ui: missing ${source}; run npm run generate:api-types from archlucid-ui first.`);

    process.exit(1);
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
}

if (!fs.existsSync(uiTypesDir)) {
  console.error(`sync-from-ui: missing ${uiTypesDir}; run npm run generate:api-types from archlucid-ui first.`);

  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
for (const file of ["schemas.generated.ts", "paths.generated.ts", "index.ts"]) {
  copyIfExists(file);
}

const barrelDest = path.resolve(packageRoot, "src", "api-types.generated.ts");
fs.writeFileSync(
  barrelDest,
  `/** Backward-compatible barrel synced from archlucid-ui. */\nexport type { components, paths } from "./api-types/index.js";\n`,
);

console.info(`sync-from-ui: copied split api-types → ${path.relative(packageRoot, destDir)}`);
