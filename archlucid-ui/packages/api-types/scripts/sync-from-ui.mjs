/**
 * Copies the UI-local openapi-typescript output into this package before `tsc`.
 * Keeps a single generation command on `archlucid-ui` (`npm run generate:api-types`).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const uiRoot = path.resolve(packageRoot, "..", "..");
const uiGenerated = path.resolve(uiRoot, "src", "lib", "api-types.generated.ts");
const dest = path.resolve(packageRoot, "src", "api-types.generated.ts");

if (!fs.existsSync(uiGenerated)) {
  console.error(`sync-from-ui: missing ${uiGenerated}; run npm run generate:api-types from archlucid-ui first.`);

  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(uiGenerated, dest);

console.info(`sync-from-ui: copied → ${path.relative(packageRoot, dest)}`);
