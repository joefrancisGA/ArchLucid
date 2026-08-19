namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class EvidenceValidationStageOutcome
{
    public EvidenceValidationStage Stage
    {
        get;
        set;
    }

    public bool Passed
    {
        get;
        set;
    }

    public string? Detail
    {
        get;
        set;
    }

    public bool IsDeterministic
    {
        get;
        set;
    }
}
