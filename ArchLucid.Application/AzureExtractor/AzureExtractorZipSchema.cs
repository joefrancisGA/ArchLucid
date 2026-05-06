namespace ArchLucid.Application.AzureExtractor;

/// <summary>Supported <c>manifest.json</c> schema versions for customer Azure extractor uploads.</summary>
public static class AzureExtractorZipSchema
{
    /// <summary>Initial shipped schema aligning with <c>Get-ArchLucidAzurePackage.ps1</c> output layout.</summary>
    public const int SupportedVersion1 = 1;

    /// <inheritdoc cref="SupportedVersion1"/>
    public static IReadOnlyCollection<int> AllSupportedVersions
    {
        get;
    } = [SupportedVersion1];
}
