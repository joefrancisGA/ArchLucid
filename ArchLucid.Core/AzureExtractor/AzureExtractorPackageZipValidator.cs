namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Validates customer Azure extractor ZIP layout (<c>manifest.json</c> schema version 1 and required companion files)
///     without loading uncompressed entry payloads into memory (pass-17 partial split).
/// </summary>
public static partial class AzureExtractorPackageZipValidator
{
    public const string ManifestEntryName = "manifest.json";

    public const string ResourcesEntryName = "resources.json";

    public const int SupportedSchemaVersion = 1;
}
