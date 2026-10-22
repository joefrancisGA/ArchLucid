namespace ArchLucid.Application.AzureExtractor;

/// <summary>Azure-hosted extractor poll result — delegates to shared cloud extractor envelope.</summary>
public sealed class HostedAzureExtractorRunResult
{
    private readonly CloudExtractor.HostedCloudExtractorRunResult _inner;

    private HostedAzureExtractorRunResult(CloudExtractor.HostedCloudExtractorRunResult inner)
    {
        _inner = inner;
    }

    public bool Succeeded => _inner.Succeeded;

    public Guid? PackageId => _inner.PackageId;

    public int ResourceCount => _inner.ResourceCount;

    public string? FailureDetail => _inner.FailureDetail;

    public HostedAzureExtractorRunFailureKind FailureKind =>
        (HostedAzureExtractorRunFailureKind)_inner.FailureKind;

    public static HostedAzureExtractorRunResult CreateSuccess(Guid packageId, int resourceCount) =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateSuccess(packageId, resourceCount));

    public static HostedAzureExtractorRunResult CreateFeatureDisabled() =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateFeatureDisabled("Azure", "HostedAzureExtractor"));

    public static HostedAzureExtractorRunResult CreateNotConfigured() =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateNotConfigured(
            "Azure",
            "No hosted Azure extractor configuration exists for this tenant and subscription."));

    public static HostedAzureExtractorRunResult CreateIngestFailed(string detail) =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateIngestFailed(detail));

    public static HostedAzureExtractorRunResult CreateThrottled(string detail) =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateThrottled(detail));

    public static HostedAzureExtractorRunResult CreateCollectionFailed(string detail) =>
        Wrap(CloudExtractor.HostedCloudExtractorRunResult.CreateCollectionFailed(detail));

    private static HostedAzureExtractorRunResult Wrap(CloudExtractor.HostedCloudExtractorRunResult inner) =>
        new(inner);
}

public enum HostedAzureExtractorRunFailureKind
{
    None = 0,
    FeatureDisabled = 1,
    NotConfigured = 2,
    IngestFailed = 3,
    Throttled = 4,
    CollectionFailed = 5
}
