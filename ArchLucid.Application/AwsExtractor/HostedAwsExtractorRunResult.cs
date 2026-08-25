namespace ArchLucid.Application.AwsExtractor;

/// <summary>AWS-hosted extractor poll result — delegates to shared cloud extractor envelope.</summary>
public sealed class HostedAwsExtractorRunResult
{
    private readonly CloudExtractor.HostedCloudExtractorRunResult _inner;

    private HostedAwsExtractorRunResult(CloudExtractor.HostedCloudExtractorRunResult inner)
    {
        _inner = inner;
    }

    public bool Succeeded => _inner.Succeeded;

    public Guid? PackageId => _inner.PackageId;

    public int ResourceCount => _inner.ResourceCount;

    public string? FailureDetail => _inner.FailureDetail;

    public HostedAwsExtractorRunFailureKind FailureKind =>
        (HostedAwsExtractorRunFailureKind)_inner.FailureKind;

    public static HostedAwsExtractorRunResult CreateSuccess(Guid packageId, int resourceCount) =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateSuccess(packageId, resourceCount));

    public static HostedAwsExtractorRunResult CreateFeatureDisabled() =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateFeatureDisabled("AWS", "HostedAwsExtractor"));

    public static HostedAwsExtractorRunResult CreateNotConfigured() =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateNotConfigured(
            "AWS",
            "No hosted AWS extractor connection exists for this tenant."));

    public static HostedAwsExtractorRunResult CreateIngestFailed(string detail) =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateIngestFailed(detail));

    public static HostedAwsExtractorRunResult CreateThrottled(string detail) =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateThrottled(detail));

    public static HostedAwsExtractorRunResult CreateCollectionFailed(string detail) =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateCollectionFailed(detail));

    private static HostedAwsExtractorRunResult Wrap(CloudExtractor.HostedCloudExtractorRunResult inner) =>
        new(inner);
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
