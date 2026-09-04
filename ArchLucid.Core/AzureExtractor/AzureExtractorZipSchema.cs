namespace ArchLucid.Core.AzureExtractor;

/// <summary>Supported <c>manifest.json</c> schema versions for Azure extractor ZIP packages.</summary>
public static class AzureExtractorZipSchema
{
    /// <summary>Initial shipped schema (resources.json + manifest only).</summary>
    public const int Version1 = 1;

    /// <summary>Infra-evidence enrichment: optional sibling inventory files + manifest completeness metadata.</summary>
    public const int Version2 = 2;

    public const int MinimumSupportedVersion = Version1;

    public const int CurrentVersion = Version2;

    public static IReadOnlyCollection<int> AllSupportedVersions { get; } = [Version1, Version2];

    public static bool IsSupported(int schemaVersion) =>
        schemaVersion >= MinimumSupportedVersion && schemaVersion <= CurrentVersion;
}
