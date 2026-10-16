using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Advisory.Models;

public class ImprovementRecommendation
{
    public Guid RecommendationId
    {
        get;
        set;
    } = Guid.NewGuid();

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
    } = "Medium";

    public string ExpectedImpact
    {
        get;
        set;
    } = null!;

    private List<string> supportingFindingIds = [];

    public List<string> SupportingFindingIds
    {
        get => supportingFindingIds;
        set => supportingFindingIds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> supportingDecisionIds = [];

    public List<string> SupportingDecisionIds
    {
        get => supportingDecisionIds;
        set => supportingDecisionIds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> supportingArtifactIds = [];

    public List<string> SupportingArtifactIds
    {
        get => supportingArtifactIds;
        set => supportingArtifactIds = ContractCollectionDefaults.Coalesce(value);
    }

    public int PriorityScore
    {
        get;
        set;
    }
}
