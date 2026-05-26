/** Keep aligned with {@link ArchLucid.Core.AzureExtractor.AzureExtractorPackageZipValidator.SupportedSchemaVersion}. */
export const ARCH_LUCID_AZURE_EXTRACTOR_SUPPORTED_SCHEMA_VERSION = 1;

export function formatUnsupportedAzureExtractorSchemaVersionMessage(schemaVersion: number): string {
  return `Unsupported schema version: ${schemaVersion}. Required schemaVersion is ${ARCH_LUCID_AZURE_EXTRACTOR_SUPPORTED_SCHEMA_VERSION}. Re-run Get-ArchLucidAzurePackage.ps1 and upload the new ZIP.`;
}
