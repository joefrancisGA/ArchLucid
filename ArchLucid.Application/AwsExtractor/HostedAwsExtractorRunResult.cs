namespace ArchLucid.Application.AwsExtractor;

public sealed class HostedAwsExtractorRunResult
{
    public bool Succeeded { get; init; }

    public Guid? PackageId { get; init; }

    public int ResourceCount { get; init; }

    public string? FailureDetail { get; init; }

    public HostedAwsExtractorRunFailureKind FailureKind { get; init; }

    public static HostedAwsExtractorRunResult CreateSuccess(Guid packageId, int resourceCount) =>
        new()
        {
            Succeeded = true,
            PackageId = packageId,
            ResourceCount = resourceCount,
            FailureKind = HostedAwsExtractorRunFailureKind.None
        };

    public static HostedAwsExtractorRunResult CreateFeatureDisabled() =>
        new()
        {
            Succeeded = false,
            FailureDetail = "Hosted AWS extractor is disabled (HostedAwsExtractor:Enabled=false).",
            FailureKind = HostedAwsExtractorRunFailureKind.FeatureDisabled
        };

    public static HostedAwsExtractorRunResult CreateNotConfigured() =>
        new()
        {
            Succeeded = false,
            FailureDetail = "No hosted AWS extractor connection exists for this tenant.",
            FailureKind = HostedAwsExtractorRunFailureKind.NotConfigured
        };

    public static HostedAwsExtractorRunResult CreateIngestFailed(string detail) =>
        new()
        {
            Succeeded = false,
            FailureDetail = detail,
            FailureKind = HostedAwsExtractorRunFailureKind.IngestFailed
        };

    public static HostedAwsExtractorRunResult CreateThrottled(string detail) =>
        new()
        {
            Succeeded = false,
            FailureDetail = detail,
            FailureKind = HostedAwsExtractorRunFailureKind.Throttled
        };

    public static HostedAwsExtractorRunResult CreateCollectionFailed(string detail) =>
        new()
        {
            Succeeded = false,
            FailureDetail = detail,
            FailureKind = HostedAwsExtractorRunFailureKind.CollectionFailed
        };
}

public enum HostedAwsExtractorRunFailureKind
{
    None = 0,
    FeatureDisabled = 1,
    NotConfigured = 2,
    IngestFailed = 3,
    Throttled = 4,
    CollectionFailed = 5
}
