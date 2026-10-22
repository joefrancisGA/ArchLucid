namespace ArchLucid.AgentRuntime.Caching;

/// <summary>
///     Per-agent-task disclosure flag when an LLM completion was served from cache (TB-970).
/// </summary>
public static class LlmCompletionCacheServedAmbient
{
    private static readonly AsyncLocal<bool> CacheServedLocal = new();

    /// <summary>Whether the current task scope observed a cache hit.</summary>
    public static bool CurrentTaskCacheServed => CacheServedLocal.Value;

    /// <summary>Marks the current task as cache-served (idempotent within the scope).</summary>
    public static void MarkServed()
    {
        CacheServedLocal.Value = true;
    }

    /// <summary>Resets cache-served for one agent task execution.</summary>
    public static IDisposable BeginTaskScope()
    {
        bool previous = CacheServedLocal.Value;
        CacheServedLocal.Value = false;

        return new PopScope(previous);
    }

    private sealed class PopScope(bool previous) : IDisposable
    {
        private bool _disposed;

        public void Dispose()
        {
            if (_disposed)
                return;

            _disposed = true;
            CacheServedLocal.Value = previous;
        }
    }
}
