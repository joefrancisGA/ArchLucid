namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class EvidenceValidationResult
{
    public string FindingId
    {
        get;
        set;
    } = null!;

    public List<EvidenceValidationStageOutcome> StageResults
    {
        get;
        set;
    } = [];

    public bool OverallPassedIntegrity
    {
        get;
        set;
    }

    public SemanticSupportAssessment? SemanticAssessment
    {
        get;
        set;
    }

    public string? CompletenessNotes
    {
        get;
        set;
    }

    public bool Escalated
    {
        get;
        set;
    }

    public EvidenceSupportTier SupportTier
    {
        get;
        set;
    } = EvidenceSupportTier.Unverified;
}
