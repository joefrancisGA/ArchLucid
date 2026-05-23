namespace ArchLucid.Contracts.Advisory.Workflow;

/// <summary>Durable advisory recommendation row with workflow status and JSON supporting-entity arrays.</summary>
public class RecommendationRecord
{
    public Guid RecommendationId
    {
        get;
        set;
    }

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

    public Guid RunId
    {
        get;
        set;
    }

    public Guid? ComparedToRunId
    {
        get;
        set;
    }

    public string Title
    {
        get;
        set;
    } = null!;

    public string Category
    {
        get;
        set;
    } = null!;

    public string Rationale
    {
        get;
        set;
    } = null!;

    public string SuggestedAction
    {
        get;
        set;
    } = null!;

    public string Urgency
    {
        get;
        set;
    } = null!;

    public string ExpectedImpact
    {
        get;
        set;
    } = null!;

    public int PriorityScore
    {
        get;
        set;
    }

    public string Status
    {
        get;
        set;
    } = RecommendationStatus.Proposed;

    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public DateTime LastUpdatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public string? ReviewedByUserId
    {
        get;
        set;
    }

    public string? ReviewedByUserName
    {
        get;
        set;
    }

    public string? ReviewComment
    {
        get;
        set;
    }

    public string? ResolutionRationale
    {
        get;
        set;
    }

    public string SupportingFindingIdsJson
    {
        get;
        set;
    } = "[]";

    public string SupportingDecisionIdsJson
    {
        get;
        set;
    } = "[]";

    public string SupportingArtifactIdsJson
    {
        get;
        set;
    } = "[]";
}
