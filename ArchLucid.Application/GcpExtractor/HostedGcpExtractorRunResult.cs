namespace ArchLucid.Application.GcpExtractor;

public sealed class HostedGcpExtractorRunResult
{
    public bool Succeeded { get; init; }

    public Guid? PackageId { get; init; }

    public int ResourceCount { get; init; }

    public string? FailureDetail { get; init; }

    public HostedGcpExtractorRunFailureKind FailureKind { get; init; }

    public static HostedGcpExtractorRunResult CreateSuccess(Guid packageId, int resourceCount) =>
        new()
        {
            Succeeded = true,
            PackageId = packageId,
            ResourceCount = resourceCount,
            FailureKind = HostedGcpExtractorRunFailureKind.None
        };

    public static HostedGcpExtractorRunResult CreateFeatureDisabled() =>
        new()
        {
            Succeeded = false,
            FailureDetail = "Hosted GCP extractor is disabled (HostedGcpExtractor:Enabled=false).",
            FailureKind = HostedGcpExtractorRunFailureKind.FeatureDisabled
        };

    public static HostedGcpExtractorRunResult CreateNotConfigured() =>
        new()
        {
            Succeeded = false,
            FailureDetail = "No hosted GCP extractor connection exists for this tenant.",
            FailureKind = HostedGcpExtractorRunFailureKind.NotConfigured
        };

    public static HostedGcpExtractorRunResult CreateIngestFailed(string detail) =>
        new()
        {
            Succeeded = false,
            FailureDetail = detail,
            FailureKind = HostedGcpExtractorRunFailureKind.IngestFailed
        };

    public static HostedGcpExtractorRunResult CreateThrottled(string detail) =>
        new()
        {
            Succeeded = false,
            FailureDetail = detail,
            FailureKind = HostedGcpExtractorRunFailureKind.Throttled
        };

    public static HostedGcpExtractorRunResult CreateCollectionFailed(string detail) =>
        new()
        {
            Succeeded = false,
            FailureDetail = detail,
            FailureKind = HostedGcpExtractorRunFailureKind.CollectionFailed
        };
}

public enum HostedGcpExtractorRunFailureKind
{
    None = 0,
    FeatureDisabled = 1,
    NotConfigured = 2,
    IngestFailed = 3,
    Throttled = 4,
    CollectionFailed = 5
}
