namespace ArchLucid.Contracts.Abstractions.Integrations;

public sealed class HostedAwsExtractorCollectionRequest
{
    public required string AccountId { get; init; }

    public required string Region { get; init; }

    public required string RoleArn { get; init; }
}

public sealed class HostedAwsExtractorCollectionResult
{
    public required byte[] ZipBytes { get; init; }

    public required string OriginalFileName { get; init; }

    public int ResourceCount { get; init; }
}

/// <summary>
///     Collects a schema v1 AWS inventory ZIP via OIDC-federated AssumeRole and read-only Resource Explorer search.
/// </summary>
public interface IHostedAwsExtractorClient
{
    Task<HostedAwsExtractorCollectionResult> CollectZipAsync(
        HostedAwsExtractorCollectionRequest request,
        CancellationToken cancellationToken);
}
