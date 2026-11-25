using ArchLucid.Contracts.Serialization;

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

    private string title = string.Empty;

    public string Title
    {
        get => title;
        set => title = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string category = string.Empty;

    public string Category
    {
        get => category;
        set => category = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string rationale = string.Empty;

    public string Rationale
    {
        get => rationale;
        set => rationale = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string suggestedAction = string.Empty;

    public string SuggestedAction
    {
        get => suggestedAction;
        set => suggestedAction = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string urgency = string.Empty;

    public string Urgency
    {
        get => urgency;
        set => urgency = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string expectedImpact = string.Empty;

    public string ExpectedImpact
    {
        get => expectedImpact;
        set => expectedImpact = ContractCollectionDefaults.CoalesceRequired(value);
    }

    public int PriorityScore
    {
        get;
        set;
    }

    private string status = RecommendationStatus.Proposed;

    public string Status
    {
        get => status;
        set => status = ContractCollectionDefaults.CoalesceStringDefault(value, RecommendationStatus.Proposed);
    }

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

    private string supportingFindingIdsJson = "[]";

    public string SupportingFindingIdsJson
    {
        get => supportingFindingIdsJson;
        set => supportingFindingIdsJson = ContractCollectionDefaults.CoalesceJsonArrayLiteral(value);
    }

    private string supportingDecisionIdsJson = "[]";

    public string SupportingDecisionIdsJson
    {
        get => supportingDecisionIdsJson;
        set => supportingDecisionIdsJson = ContractCollectionDefaults.CoalesceJsonArrayLiteral(value);
    }

    private string supportingArtifactIdsJson = "[]";

    public string SupportingArtifactIdsJson
    {
        get => supportingArtifactIdsJson;
        set => supportingArtifactIdsJson = ContractCollectionDefaults.CoalesceJsonArrayLiteral(value);
    }

    private string sourceEvidenceLinksJson = "[]";

    public string SourceEvidenceLinksJson
    {
        get => sourceEvidenceLinksJson;
        set => sourceEvidenceLinksJson = ContractCollectionDefaults.CoalesceJsonArrayLiteral(value);
    }
}