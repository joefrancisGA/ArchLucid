import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { ProductLineId } from "@/lib/product-line/product-line-id";

const ARCHLUCID_AZURE_EXTRACTOR_SCRIPT_RELATIVE_PATH = join("scripts", "azure", "Get-ArchLucidAzurePackage.ps1");
const SECURENOW_AZURE_EXTRACTOR_SCRIPT_RELATIVE_PATH = join("scripts", "azure", "Get-SecureNowAzurePackage.ps1");

function resolveAzureExtractorScriptRelativePath(productLineId: ProductLineId = "architecture"): string {
  if (productLineId === "security") {
    return SECURENOW_AZURE_EXTRACTOR_SCRIPT_RELATIVE_PATH;
  }

  return ARCHLUCID_AZURE_EXTRACTOR_SCRIPT_RELATIVE_PATH;
}

function resolveMonorepoRootFromUiCwd(): string {
  const cwd = process.cwd();

  if (existsSync(join(cwd, "..", "scripts", "azure", "Get-ArchLucidAzurePackage.ps1"))) {
    return join(cwd, "..");
  }

  return cwd;
}

export function resolveAzureExtractorScriptAbsolutePath(
  productLineId: ProductLineId = "architecture",
): string | null {
  const relativePath = resolveAzureExtractorScriptRelativePath(productLineId);
  const scriptFileName = relativePath.split("/").pop() ?? relativePath;

  const candidates = [
    join(resolveMonorepoRootFromUiCwd(), relativePath),
    join("/scripts", "azure", scriptFileName),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function tryReadAzureExtractorScript(productLineId: ProductLineId = "architecture"): string | null {
  const absolutePath = resolveAzureExtractorScriptAbsolutePath(productLineId);

  if (absolutePath === null) {
    return null;
  }

  return readFileSync(absolutePath, "utf8").replace(/\r\n/g, "\n");
}
