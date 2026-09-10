import type { ProductLineId } from "@/lib/product-line/product-line-id";

export const ARCHLUCID_AZURE_EXTRACTOR_SCRIPT_API_PATH =
  "/api/extractor-scripts/azure/Get-ArchLucidAzurePackage.ps1" as const;

export const SECURENOW_AZURE_EXTRACTOR_SCRIPT_API_PATH =
  "/api/extractor-scripts/azure/Get-SecureNowAzurePackage.ps1" as const;

/** @deprecated Use {@link azureExtractorScriptApiPath} for product-line aware routing. */
export const AZURE_EXTRACTOR_SCRIPT_API_PATH = ARCHLUCID_AZURE_EXTRACTOR_SCRIPT_API_PATH;

export function azureExtractorScriptApiPath(productLineId: ProductLineId = "architecture"): string {
  if (productLineId === "security") {
    return SECURENOW_AZURE_EXTRACTOR_SCRIPT_API_PATH;
  }

  return ARCHLUCID_AZURE_EXTRACTOR_SCRIPT_API_PATH;
}

/** Public download URL for the Azure packager script (same-origin API route by default). */
export function extractorScriptCdnUrl(productLineId: ProductLineId = "architecture"): string {
  const configuredUrl = process.env.NEXT_PUBLIC_EXTRACTOR_SCRIPT_CDN_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  return azureExtractorScriptApiPath(productLineId);
}

/** @deprecated Use {@link extractorScriptCdnUrl} for product-line aware routing. */
export const EXTRACTOR_SCRIPT_CDN_URL = extractorScriptCdnUrl("architecture");
