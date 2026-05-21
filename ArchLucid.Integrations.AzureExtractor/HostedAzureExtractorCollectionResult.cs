namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureExtractorCollectionResult
{
    public required byte[] ZipBytes { get; init; }

    public required string OriginalFileName { get; init; }

    public required int ResourceCount { get; init; }
}
