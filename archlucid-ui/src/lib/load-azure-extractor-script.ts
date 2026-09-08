import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const AZURE_EXTRACTOR_SCRIPT_RELATIVE_PATH = join("scripts", "azure", "Get-ArchLucidAzurePackage.ps1");

function resolveMonorepoRootFromUiCwd(): string {
  const cwd = process.cwd();

  if (existsSync(join(cwd, "..", "scripts", "azure", "Get-ArchLucidAzurePackage.ps1"))) {
    return join(cwd, "..");
  }

  return cwd;
}

export function resolveAzureExtractorScriptAbsolutePath(): string | null {
  const candidates = [
    join(resolveMonorepoRootFromUiCwd(), AZURE_EXTRACTOR_SCRIPT_RELATIVE_PATH),
    join("/scripts", "azure", "Get-ArchLucidAzurePackage.ps1"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function tryReadAzureExtractorScript(): string | null {
  const absolutePath = resolveAzureExtractorScriptAbsolutePath();

  if (absolutePath === null) {
    return null;
  }

  return readFileSync(absolutePath, "utf8").replace(/\r\n/g, "\n");
}
