namespace ArchLucid.Core.Retrieval;

/// <summary>
///     Ambient expansion latency from the current Graph-RAG expander call (same async flow as retrieval search).
/// </summary>
public static class GraphRagExpansionLatencyAmbient
{
    private static readonly AsyncLocal<double?> Current = new();

    public static void Set(double expansionLatencyMilliseconds)
    {
        Current.Value = expansionLatencyMilliseconds;
    }

    /// <summary>Reads and clears the ambient latency so only one trace row consumes it.</summary>
    public static double? TakeMilliseconds()
    {
        double? value = Current.Value;
        Current.Value = null;

        return value;
    }
}
