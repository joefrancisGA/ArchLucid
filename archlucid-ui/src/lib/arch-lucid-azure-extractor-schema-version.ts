/** Keep aligned with {@link ArchLucid.Core.AzureExtractor.AzureExtractorZipSchema}. */
export const ARCH_LUCID_AZURE_EXTRACTOR_MINIMUM_SUPPORTED_SCHEMA_VERSION = 1;

/** Current packager/hosted collector schema (v2 adds completeness metadata). */
export const ARCH_LUCID_AZURE_EXTRACTOR_SUPPORTED_SCHEMA_VERSION = 2;

export function isSupportedAzureExtractorSchemaVersion(schemaVersion: number): boolean {
  return (
    schemaVersion >= ARCH_LUCID_AZURE_EXTRACTOR_MINIMUM_SUPPORTED_SCHEMA_VERSION &&
    schemaVersion <= ARCH_LUCID_AZURE_EXTRACTOR_SUPPORTED_SCHEMA_VERSION
  );
}

export function formatUnsupportedAzureExtractorSchemaVersionMessage(schemaVersion: number): string {
  return `Unsupported manifest schemaVersion: ${schemaVersion}. Supported schema versions: ${ARCH_LUCID_AZURE_EXTRACTOR_MINIMUM_SUPPORTED_SCHEMA_VERSION}–${ARCH_LUCID_AZURE_EXTRACTOR_SUPPORTED_SCHEMA_VERSION}.`;
}
