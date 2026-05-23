namespace ArchLucid.Contracts.Abstractions.Integrations;

public sealed class HostedAzureExtractorCollectionResult
{
    public required byte[] ZipBytes { get; init; }

    public required string OriginalFileName { get; init; }

    public required int ResourceCount { get; init; }
}
