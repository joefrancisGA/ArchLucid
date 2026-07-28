namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class EffortEstimate
{
    /// <summary>Effort band: Low, Medium, High, or Unknown.</summary>
    public string Band
    {
        get;
        set;
    } = null!;

    public string BasisNotes
    {
        get;
        set;
    } = null!;

    public bool ImplementationEstimateAvailable
    {
        get;
        set;
    }
}
