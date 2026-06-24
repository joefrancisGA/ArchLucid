/** Keep aligned with {@link ArchLucid.Core.AzureExtractor.AzureExtractorPackageZipValidator.SupportedSchemaVersion}. */
export const ARCH_LUCID_AZURE_EXTRACTOR_SUPPORTED_SCHEMA_VERSION = 1;

export function formatUnsupportedAzureExtractorSchemaVersionMessage(schemaVersion: number): string {
  return `Unsupported manifest schemaVersion: ${schemaVersion}. Required schemaVersion: ${ARCH_LUCID_AZURE_EXTRACTOR_SUPPORTED_SCHEMA_VERSION}.`;
}
