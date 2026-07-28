namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ExtractionFidelityScore
{
    public string CaseId
    {
        get;
        set;
    } = null!;

    public double Precision
    {
        get;
        set;
    }

    public double Recall
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
