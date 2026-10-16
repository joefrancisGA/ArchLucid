using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class GoldenArchitectureTestResult
{
    /// <summary>Auditable counts on the pre-apply (post-review) model.</summary>
    private Dictionary<string, int> beforeCounts = new();

    public Dictionary<string, int> BeforeCounts
    {
        get => beforeCounts;
        set => beforeCounts = ContractCollectionDefaults.CoalesceDictionary(value);
    }

    /// <summary>Auditable counts after recommendation apply + re-review.</summary>
    private Dictionary<string, int> afterCounts = new();

    public Dictionary<string, int> AfterCounts
    {
        get => afterCounts;
        set => afterCounts = ContractCollectionDefaults.CoalesceDictionary(value);
    }

    private Dictionary<string, int> deltaCounts = new();

    public Dictionary<string, int> DeltaCounts
    {
        get => deltaCounts;
        set => deltaCounts = ContractCollectionDefaults.CoalesceDictionary(value);
    }

    public double PlantedDefectRecall
    {
        get;
        set;
    }

    private List<string> plantedDefectsDetected = [];

    public List<string> PlantedDefectsDetected
    {
        get => plantedDefectsDetected;
        set => plantedDefectsDetected = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> plantedDefectsMissed = [];

    public List<string> PlantedDefectsMissed
    {
        get => plantedDefectsMissed;
        set => plantedDefectsMissed = ContractCollectionDefaults.Coalesce(value);
    }

    public int FalsePositiveCount
    {
        get;
        set;
    }

    /// <summary>Measured false positives grouped by specialist quality dimension.</summary>
    private Dictionary<string, int> falsePositivesByDimension = new();

    public Dictionary<string, int> FalsePositivesByDimension
    {
        get => falsePositivesByDimension;
        set => falsePositivesByDimension = ContractCollectionDefaults.CoalesceDictionary(value);
    }

    private List<CategoryBenchmarkScore> categoryScores = [];

    public List<CategoryBenchmarkScore> CategoryScores
    {
        get => categoryScores;
        set => categoryScores = ContractCollectionDefaults.Coalesce(value);
    }

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
