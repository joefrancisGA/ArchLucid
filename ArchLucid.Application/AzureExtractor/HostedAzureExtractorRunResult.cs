namespace ArchLucid.Application.AzureExtractor;

public sealed class HostedAzureExtractorRunResult
{
    public bool Succeeded { get; init; }

    public Guid? PackageId { get; init; }

    public int ResourceCount { get; init; }

    public string? FailureDetail { get; init; }

    public HostedAzureExtractorRunFailureKind FailureKind { get; init; }

    public static HostedAzureExtractorRunResult CreateSuccess(Guid packageId, int resourceCount) =>
        new()
        {
            Succeeded = true,
            PackageId = packageId,
            ResourceCount = resourceCount,
            FailureKind = HostedAzureExtractorRunFailureKind.None
        };

    public static HostedAzureExtractorRunResult CreateFeatureDisabled() =>
        new()
        {
            Succeeded = false,
            FailureDetail = "Hosted Azure extractor is disabled (HostedAzureExtractor:Enabled=false).",
            FailureKind = HostedAzureExtractorRunFailureKind.FeatureDisabled
        };

    public static HostedAzureExtractorRunResult CreateNotConfigured() =>
        new()
        {
            Succeeded = false,
            FailureDetail = "No hosted Azure extractor configuration exists for this tenant and subscription.",
            FailureKind = HostedAzureExtractorRunFailureKind.NotConfigured
        };

    public static HostedAzureExtractorRunResult CreateIngestFailed(string detail) =>
        new()
        {
            Succeeded = false,
            FailureDetail = detail,
            FailureKind = HostedAzureExtractorRunFailureKind.IngestFailed
        };
}

public enum HostedAzureExtractorRunFailureKind
{
    None = 0,
    FeatureDisabled = 1,
    NotConfigured = 2,
    IngestFailed = 3
}
