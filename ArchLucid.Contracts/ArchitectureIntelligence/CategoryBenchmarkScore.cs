namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class CategoryBenchmarkScore
{
    public BenchmarkScoreCategory Category
    {
        get;
        set;
    }

    /// <summary>Score in [0, 1].</summary>
    public double Score
    {
        get;
        set;
    }

    public string Detail
    {
        get;
        set;
    } = string.Empty;
}
