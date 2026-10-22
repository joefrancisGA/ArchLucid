/** Returns true when the file looks like a Tier-1 Azure extractor ZIP upload. */
export function isAzureExtractorZipFile(file: File): boolean {
  const name = file.name.trim().toLowerCase();

  if (name.endsWith(".zip")) {
    return true;
  }

  const type = file.type.trim().toLowerCase();

  return type === "application/zip" || type === "application/x-zip-compressed";
}

export const AZURE_EXTRACTOR_ZIP_ONLY_MESSAGE =
  "Only .zip files from Get-ArchLucidAzurePackage.ps1 are accepted here.";
