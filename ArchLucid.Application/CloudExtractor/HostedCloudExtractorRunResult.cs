namespace ArchLucid.Application.CloudExtractor;

/// <summary>Cloud-agnostic result envelope for hosted extractor poll runs (Azure, AWS, GCP).</summary>
public sealed class HostedCloudExtractorRunResult
{
    public bool Succeeded { get; init; }

    public Guid? PackageId { get; init; }

    public int ResourceCount { get; init; }

    public string? FailureDetail { get; init; }

    public HostedCloudExtractorRunFailureKind FailureKind { get; init; }

    public static HostedCloudExtractorRunResult CreateSuccess(Guid packageId, int resourceCount) =>
        new()
        {
            Succeeded = true,
            PackageId = packageId,
            ResourceCount = resourceCount,
            FailureKind = HostedCloudExtractorRunFailureKind.None
        };

    public static HostedCloudExtractorRunResult CreateFeatureDisabled(string cloudDisplayName, string configurationSection) =>
        new()
        {
            Succeeded = false,
            FailureDetail = $"Hosted {cloudDisplayName} extractor is disabled ({configurationSection}:Enabled=false).",
            FailureKind = HostedCloudExtractorRunFailureKind.FeatureDisabled
        };

    public static HostedCloudExtractorRunResult CreateNotConfigured(string cloudDisplayName, string detail) =>
        new()
        {
            Succeeded = false,
            FailureDetail = detail,
            FailureKind = HostedCloudExtractorRunFailureKind.NotConfigured
        };

    public static HostedCloudExtractorRunResult CreateIngestFailed(string detail) =>
        new()
        {
            Succeeded = false,
            FailureDetail = detail,
            FailureKind = HostedCloudExtractorRunFailureKind.IngestFailed
        };

    public static HostedCloudExtractorRunResult CreateThrottled(string detail) =>
        new()
        {
            Succeeded = false,
            FailureDetail = detail,
            FailureKind = HostedCloudExtractorRunFailureKind.Throttled
        };

    public static HostedCloudExtractorRunResult CreateCollectionFailed(string detail) =>
        new()
        {
            Succeeded = false,
            FailureDetail = detail,
            FailureKind = HostedCloudExtractorRunFailureKind.CollectionFailed
        };
}
