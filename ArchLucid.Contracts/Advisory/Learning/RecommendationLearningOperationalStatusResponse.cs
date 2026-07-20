namespace ArchLucid.Contracts.Advisory.Learning;

/// <summary>Internal operator view of recommendation-learning scope, eligibility, and active profile state.</summary>
public sealed class RecommendationLearningOperationalStatusResponse
{
    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    public string EnvironmentName
    {
        get;
        set;
    } = string.Empty;

    public string ScopeLabel
    {
        get;
        set;
    } = "Tenant / Workspace / Project";

    public RecommendationLearningProfileState ProfileState
    {
        get;
        set;
    }

    public int EligibleOutcomeCount
    {
        get;
        set;
    }

    public int ProposedOutcomeCount
    {
        get;
        set;
    }

    public int MinimumRequiredOutcomes
    {
        get;
        set;
    } = RecommendationLearningAlgorithmVersions.MinimumEligibleOutcomes;

    public int RebuildBatchCap
    {
        get;
        set;
    } = RecommendationLearningAlgorithmVersions.RebuildBatchCap;

    public DateTime? OldestEligibleOutcomeUtc
    {
        get;
        set;
    }

    public DateTime? NewestEligibleOutcomeUtc
    {
        get;
        set;
    }

    public DateTime? LastAttemptedBuildUtc
    {
        get;
        set;
    }

    public string? LastBuildResult
    {
        get;
        set;
    }

    public string? BlockingReason
    {
        get;
        set;
    }

    public RecommendationLearningProfileMetadataResponse? ActiveProfile
    {
        get;
        set;
    }

    public RecommendationLearningOutcomeEligibilityBreakdown Eligibility
    {
        get;
        set;
    } = new();
}
