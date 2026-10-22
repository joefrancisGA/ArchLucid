namespace ArchLucid.Persistence.Findings;

internal sealed class EngineInsightNoveltyRateSqlRow
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
}
