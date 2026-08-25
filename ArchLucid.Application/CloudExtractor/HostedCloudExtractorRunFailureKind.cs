namespace ArchLucid.Application.CloudExtractor;

/// <summary>Cloud-agnostic failure classification for hosted extractor poll runs.</summary>
public enum HostedCloudExtractorRunFailureKind
{
    None = 0,
    FeatureDisabled = 1,
    NotConfigured = 2,
    IngestFailed = 3,
    Throttled = 4,
    CollectionFailed = 5
}
