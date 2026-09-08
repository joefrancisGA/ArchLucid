export const AZURE_EXTRACTOR_SCRIPT_API_PATH =
  "/api/extractor-scripts/azure/Get-ArchLucidAzurePackage.ps1" as const;

/** Public download URL for the Azure packager script (same-origin API route by default). */
export const EXTRACTOR_SCRIPT_CDN_URL =
  process.env.NEXT_PUBLIC_EXTRACTOR_SCRIPT_CDN_URL?.trim() || AZURE_EXTRACTOR_SCRIPT_API_PATH;
