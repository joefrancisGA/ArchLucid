namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ClaimProvenance
{
    public ClaimOrigin Origin
    {
        get;
        set;
    }

    public SupportStatus SupportStatus
    {
        get;
        set;
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
