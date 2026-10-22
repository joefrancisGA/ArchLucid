namespace ArchLucid.Contracts.Abstractions.Integrations;

/// <summary>
///     Collects a schema v1 Azure extractor ZIP from the customer subscription via WIF-authenticated GET-only ARM calls.
/// </summary>
public interface IHostedAzureExtractorClient
{
    Task<HostedAzureExtractorCollectionResult> CollectZipAsync(
        HostedAzureExtractorCollectionRequest request,
        CancellationToken cancellationToken);
}
