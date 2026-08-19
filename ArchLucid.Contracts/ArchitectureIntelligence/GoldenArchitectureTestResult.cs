namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class GoldenArchitectureTestResult
{
    /// <summary>Auditable counts on the pre-apply (post-review) model.</summary>
    public Dictionary<string, int> BeforeCounts
    {
        get;
        set;
    } = new();

    /// <summary>Auditable counts after recommendation apply + re-review.</summary>
    public Dictionary<string, int> AfterCounts
    {
        get;
        set;
    } = new();

    public Dictionary<string, int> DeltaCounts
    {
        get;
        set;
    } = new();

    public double PlantedDefectRecall
    {
        get;
        set;
    }

    public List<string> PlantedDefectsDetected
    {
        get;
        set;
    } = [];

    public List<string> PlantedDefectsMissed
    {
        get;
        set;
    } = [];

    public int FalsePositiveCount
    {
        get;
        set;
    }

    /// <summary>Measured false positives grouped by specialist quality dimension.</summary>
    public Dictionary<string, int> FalsePositivesByDimension
    {
        get;
        set;
    } = new();

    public List<CategoryBenchmarkScore> CategoryScores
    {
        get;
        set;
    } = [];

    public bool MutationChangedFindings
    {
        get;
        set;
    }

    public bool ReReviewTriggered
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
