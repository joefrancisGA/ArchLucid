namespace ArchLucid.Application.AzureExtractor;

/// <summary>Application-layer alias for <see cref="Core.AzureExtractor.AzureExtractorZipSchema" />.</summary>
public static class AzureExtractorZipSchema
{
    public const int Version1 = Core.AzureExtractor.AzureExtractorZipSchema.Version1;

    public const int Version2 = Core.AzureExtractor.AzureExtractorZipSchema.Version2;

    public const int SupportedVersion1 = Version1;

    public static IReadOnlyCollection<int> AllSupportedVersions =>
        Core.AzureExtractor.AzureExtractorZipSchema.AllSupportedVersions;
}
