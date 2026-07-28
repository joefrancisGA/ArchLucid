namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class GoldenArchitectureTestResult
{
    public Dictionary<string, int> BeforeCounts
    {
        get;
        set;
    } = new();

    public Dictionary<string, int> AfterCounts
    {
        get;
        set;
    } = new();

    public double PlantedDefectRecall
    {
        get;
        set;
    }

    public int FalsePositiveCount
    {
        get;
        set;
    }

    public bool Passed
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
