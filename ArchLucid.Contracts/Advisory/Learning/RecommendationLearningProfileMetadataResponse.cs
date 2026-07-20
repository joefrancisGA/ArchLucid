namespace ArchLucid.Contracts.Advisory.Learning;

/// <summary>Persisted profile identity and build metadata for internal operators.</summary>
public sealed class RecommendationLearningProfileMetadataResponse
{
    public Guid ProfileId
    {
        get;
        set;
    }

    public DateTime GeneratedUtc
    {
        get;
        set;
    }

    public int OutcomeCount
    {
        get;
        set;
    }

    public string AlgorithmVersion
    {
        get;
        set;
    } = RecommendationLearningAlgorithmVersions.V1;

    public string ProfileChecksum
    {
        get;
        set;
    } = string.Empty;

    public string Status
    {
        get;
        set;
    } = "Active";

    public string ScopeLabel
    {
        get;
        set;
    } = "Tenant / Workspace / Project";

    public string FeatureSchemaVersion
    {
        get;
        set;
    } = RecommendationLearningAlgorithmVersions.FeatureSchemaVersion;

    public string? CreatedBy
    {
        get;
        set;
    }

    public string BuildSource
    {
        get;
        set;
    } = "historical-outcomes";

    public DateTime? LastActivatedUtc
    {
        get;
        set;
    }

    public int EligibleOutcomeCount
    {
        get;
        set;
    }

    public int ExcludedOutcomeCount
    {
        get;
        set;
    }

    public DateTime? SourceDataStartUtc
    {
        get;
        set;
    }

    public DateTime? SourceDataEndUtc
    {
        get;
        set;
    }

    public long? BuildDurationMs
    {
        get;
        set;
    }

    public string StorageLocation
    {
        get;
        set;
    } = "dbo.RecommendationLearningProfiles";

    public string? LastValidationResult
    {
        get;
        set;
    }
}
