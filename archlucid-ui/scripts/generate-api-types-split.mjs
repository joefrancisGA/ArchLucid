/**
 * Generates OpenAPI TypeScript types split across paths and schemas modules.
 * Keeps `src/lib/api-types.generated.ts` as a backward-compatible barrel re-export.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.resolve(__dirname, "..");
const snapshotPath = path.resolve(uiRoot, "..", "ArchLucid.Api.Tests", "Contracts", "openapi-v1.contract.snapshot.json");
const outDir = path.resolve(uiRoot, "src", "lib", "api-types");
const tempMonolith = path.resolve(outDir, ".api-types.monolith.tmp.ts");
const schemasFile = path.resolve(outDir, "schemas.generated.ts");
const pathsFile = path.resolve(outDir, "paths.generated.ts");
const indexFile = path.resolve(outDir, "index.ts");
const barrelFile = path.resolve(uiRoot, "src", "lib", "api-types.generated.ts");

function splitMonolith(source) {
  const componentsMarker = "export interface components";
  const pathsMarker = "export interface paths";

  const pathsStart = source.indexOf(pathsMarker);
  const componentsStart = source.indexOf(componentsMarker);

  if (pathsStart < 0 || componentsStart < 0) {
    throw new Error("Expected openapi-typescript output with paths and components interfaces.");
  }

  const header = source.slice(0, pathsStart).trimEnd();
  const pathsBody = source.slice(pathsStart, componentsStart).trimEnd();
  const schemasBody = source.slice(componentsStart).trimEnd();

  const schemas = `${header}\n\n${schemasBody}\n`;
  const paths = `${header}\n\nimport type { components } from "./schemas.generated";\n\n${pathsBody}\n`;

  return { schemas, paths };
}

function writeGeneratedFiles() {
  fs.mkdirSync(outDir, { recursive: true });

  execFileSync(
    "npx",
    ["openapi-typescript", snapshotPath, "-o", tempMonolith],
    { cwd: uiRoot, stdio: "inherit" },
  );

  const monolith = fs.readFileSync(tempMonolith, "utf8");
  const { schemas, paths } = splitMonolith(monolith);

  fs.writeFileSync(schemasFile, schemas);
  fs.writeFileSync(pathsFile, paths);
  fs.writeFileSync(
    indexFile,
    `/** Barrel for split OpenAPI types — do not edit by hand. */\nexport type { components } from "./schemas.generated";\nexport type { paths } from "./paths.generated";\n`,
  );
  fs.writeFileSync(
    barrelFile,
    `/** Backward-compatible barrel — prefer importing from ./api-types. */\nexport type { components, paths } from "./api-types";\n`,
  );

  fs.rmSync(tempMonolith, { force: true });
}

writeGeneratedFiles();
console.info("generate-api-types-split: wrote schemas.generated.ts, paths.generated.ts, index.ts, api-types.generated.ts barrel");
