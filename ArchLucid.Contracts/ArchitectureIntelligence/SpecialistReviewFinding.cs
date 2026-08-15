namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class SpecialistReviewFinding
{
    public string FindingId
    {
        get;
        set;
    } = null!;

    public QualityDimension Dimension
    {
        get;
        set;
    }

    public string Title
    {
        get;
        set;
    } = null!;

    public string Rationale
    {
        get;
        set;
    } = null!;

    public ReviewConclusion Conclusion
    {
        get;
        set;
    }

    public EvidenceCondition EvidenceCondition
    {
        get;
        set;
    }

    public GovernanceDisposition GovernanceDisposition
    {
        get;
        set;
    } = GovernanceDisposition.Open;

    public ClaimProvenance Provenance
    {
        get;
        set;
    } = new();

    public double Confidence
    {
        get;
        set;
    }

    public List<string> EvidenceArtifactIds
    {
        get;
        set;
    } = [];

    /// <summary>Severity label: Critical, High, Medium, or Low.</summary>
    public string Severity
    {
        get;
        set;
    } = null!;

    /// <summary>Lifecycle slice the finding targets when known (TB-2339 item 43).</summary>
    public ArchitectureLifecycleScope LifecycleScope
    {
        get;
        set;
    } = ArchitectureLifecycleScope.Unspecified;

    public List<string> RelatedModelElementIds
    {
        get;
        set;
    } = [];

    public List<string> RelatedRequirementElementIds
    {
        get;
        set;
    } = [];

    public List<string> RelatedDecisionElementIds
    {
        get;
        set;
    } = [];
}
