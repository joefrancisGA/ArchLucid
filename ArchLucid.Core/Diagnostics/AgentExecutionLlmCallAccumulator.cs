namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Thread-safe completion count for one <c>RealAgentExecutor.ExecuteAsync</c> batch (parallel handlers share one
///     instance).
/// </summary>
public sealed class AgentExecutionLlmCallAccumulator
{
    private int _count;

    /// <summary>Adds <paramref name="delta" /> successful remote completions (ignored if non-positive).</summary>
    public void AddCompletions(int delta)
    {
        if (delta > 0)

            _ = Interlocked.Add(ref _count, delta);
    }

    /// <summary>Reads and resets the accumulated count.</summary>
    public int Consume()
    {
        return Interlocked.Exchange(ref _count, 0);
    }
}
