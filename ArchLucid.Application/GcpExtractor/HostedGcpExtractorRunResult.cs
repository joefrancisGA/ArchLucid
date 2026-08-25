namespace ArchLucid.Application.GcpExtractor;

/// <summary>GCP-hosted extractor poll result — delegates to shared cloud extractor envelope.</summary>
public sealed class HostedGcpExtractorRunResult
{
    private readonly CloudExtractor.HostedCloudExtractorRunResult _inner;

    private HostedGcpExtractorRunResult(CloudExtractor.HostedCloudExtractorRunResult inner)
    {
        _inner = inner;
    }

    public bool Succeeded => _inner.Succeeded;

    public Guid? PackageId => _inner.PackageId;

    public int ResourceCount => _inner.ResourceCount;

    public string? FailureDetail => _inner.FailureDetail;

    public HostedGcpExtractorRunFailureKind FailureKind =>
        (HostedGcpExtractorRunFailureKind)_inner.FailureKind;

    public static HostedGcpExtractorRunResult CreateSuccess(Guid packageId, int resourceCount) =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateSuccess(packageId, resourceCount));

    public static HostedGcpExtractorRunResult CreateFeatureDisabled() =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateFeatureDisabled("GCP", "HostedGcpExtractor"));

    public static HostedGcpExtractorRunResult CreateNotConfigured() =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateNotConfigured(
            "GCP",
            "No hosted GCP extractor connection exists for this tenant."));

    public static HostedGcpExtractorRunResult CreateIngestFailed(string detail) =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateIngestFailed(detail));

    public static HostedGcpExtractorRunResult CreateThrottled(string detail) =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateThrottled(detail));

    public static HostedGcpExtractorRunResult CreateCollectionFailed(string detail) =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateCollectionFailed(detail));

    private static HostedGcpExtractorRunResult Wrap(CloudExtractor.HostedCloudExtractorRunResult inner) =>
        new(inner);
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
