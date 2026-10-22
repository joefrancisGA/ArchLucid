namespace ArchLucid.Core.Retrieval;

/// <summary>Bounded trace metadata for iterative retrieve-critique-retry rounds (TB-878).</summary>
public sealed class IterativeRetrievalTraceState
{
    public int IterativeRetrievalRounds
    {
        get;
        init;
    }

    public string? IterativeCritiqueDecisionsJson
    {
        get;
        init;
    }
}

/// <summary>Ambient iterative retrieval trace for the current search call (consumed by grounding trace builder).</summary>
public static class IterativeRetrievalAmbient
{
    private static readonly AsyncLocal<IterativeRetrievalTraceState?> Current = new();

    public static void Set(IterativeRetrievalTraceState? trace)
    {
        Current.Value = trace;
    }

    public static IterativeRetrievalTraceState? Take()
    {
        IterativeRetrievalTraceState? value = Current.Value;
        Current.Value = null;

        return value;
    }
}
