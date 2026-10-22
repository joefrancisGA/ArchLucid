namespace ArchLucid.Contracts.Abstractions.Integrations;

public sealed class HostedGcpExtractorCollectionRequest
{
    public required string ProjectId { get; init; }

    public required string WorkloadIdentityPoolProvider { get; init; }

    public required string ServiceAccountEmail { get; init; }
}

public sealed class HostedGcpExtractorCollectionResult
{
    public required byte[] ZipBytes { get; init; }

    public required string OriginalFileName { get; init; }

    public int ResourceCount { get; init; }
}

/// <summary>
///     Collects a schema v1 GCP inventory ZIP via Workload Identity Federation and Cloud Asset Inventory search.
/// </summary>
public interface IHostedGcpExtractorClient
{
    Task<HostedGcpExtractorCollectionResult> CollectZipAsync(
        HostedGcpExtractorCollectionRequest request,
        CancellationToken cancellationToken);
}
