using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ClaimProvenance
{
    // An omitted origin cannot establish source-backed or human-approved provenance.
    private ClaimOrigin origin = ClaimOrigin.ModelInferred;

    public ClaimOrigin Origin
    {
        get => origin;
        set => origin = ContractCollectionDefaults.RequireDefinedEnum(value);
    }

    private SupportStatus supportStatus = SupportStatus.NotYetEvaluated;

    public SupportStatus SupportStatus
    {
        get => supportStatus;
        set => supportStatus = ContractCollectionDefaults.RequireDefinedEnum(value);
    }

    /// <summary>Confidence in [0, 1].</summary>
    public double Confidence
    {
        get;
        set;
    }

    public string? SourceArtifactId
    {
        get;
        set;
    }

    public SourcePassageLocator? PassageLocator
    {
        get;
        set;
    }

    public string? Notes
    {
        get;
        set;
    }
}
