using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class SpecialistReviewFinding
{
    private string findingId = string.Empty;

    public string FindingId
    {
        get => findingId;
        set => findingId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    public QualityDimension Dimension
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

    private string rationale = string.Empty;

    public string Rationale
    {
        get => rationale;
        set => rationale = ContractCollectionDefaults.CoalesceRequired(value);
    }

    public ReviewConclusion Conclusion
    {
        get;
        set;
    } = ReviewConclusion.Indeterminate;

    public EvidenceCondition EvidenceCondition
    {
        get;
        set;
    } = EvidenceCondition.Unverified;

    public GovernanceDisposition GovernanceDisposition
    {
        get;
        set;
    } = GovernanceDisposition.Open;

    private ClaimProvenance provenance = new();

    public ClaimProvenance Provenance
    {
        get => provenance;
        set => provenance = value ?? new ClaimProvenance();
    }

    /// <summary>Candidate claim that public network access is disabled on this exact Azure resource.</summary>
    public Guid? PublicNetworkAccessDisabledResourceId { get; set; }

    public double Confidence
    {
        get;
        set;
    }

    private List<string> evidenceArtifactIds = [];

    public List<string> EvidenceArtifactIds
    {
        get => evidenceArtifactIds;
        set => evidenceArtifactIds = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Severity label: Critical, High, Medium, or Low.</summary>
    private string severity = string.Empty;

    public string Severity
    {
        get => severity;
        set => severity = ContractCollectionDefaults.CoalesceRequired(value);
    }

    /// <summary>Lifecycle slice the finding targets when known (TB-2339 item 43).</summary>
    public ArchitectureLifecycleScope LifecycleScope
    {
        get;
        set;
    } = ArchitectureLifecycleScope.Unspecified;

    private List<string> relatedModelElementIds = [];

    public List<string> RelatedModelElementIds
    {
        get => relatedModelElementIds;
        set => relatedModelElementIds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> relatedRequirementElementIds = [];

    public List<string> RelatedRequirementElementIds
    {
        get => relatedRequirementElementIds;
        set => relatedRequirementElementIds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> relatedDecisionElementIds = [];

    public List<string> RelatedDecisionElementIds
    {
        get => relatedDecisionElementIds;
        set => relatedDecisionElementIds = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Honest integrity vs semantic inference label after validation (TB-2340 item 46).</summary>
    public EvidenceSupportTier EvidenceSupportTier
    {
        get;
        set;
    } = EvidenceSupportTier.Unverified;
}
