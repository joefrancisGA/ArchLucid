namespace ArchLucid.Contracts.Findings;

/// <summary>Per-engine novelty mark rate for Decision-grade findings (DX-23).</summary>
public sealed class EngineInsightNoveltyRateRow
{
    public string EngineType
    {
        get;
        set;
    } = null!;

    public int DecisionGradeCount
    {
        get;
        set;
    }

    public int DidNotThinkOfThatCount
    {
        get;
        set;
    }

    /// <summary>DidNotThinkOfThatCount / DecisionGradeCount when denominator &gt; 0.</summary>
    public double? Rate
    {
        get;
        set;
    }
}
