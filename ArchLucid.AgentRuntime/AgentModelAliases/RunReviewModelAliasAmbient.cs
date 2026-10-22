namespace ArchLucid.AgentRuntime.AgentModelAliases;

/// <summary>Per-review effective alias override for agent routing (TB-2110).</summary>
public static class RunReviewModelAliasAmbient
{
    private static readonly AsyncLocal<string?> CurrentAlias = new();

    public static IDisposable BeginScope(string? effectiveAliasId)
    {
        string? previous = CurrentAlias.Value;
        CurrentAlias.Value = string.IsNullOrWhiteSpace(effectiveAliasId) ? null : effectiveAliasId.Trim();

        return new Scope(previous);
    }

    public static string? TryPeek()
    {
        return CurrentAlias.Value;
    }

    private sealed class Scope(string? previous) : IDisposable
    {
        private bool _disposed;

        public void Dispose()
        {
            if (_disposed)
            {
                return;
            }

            CurrentAlias.Value = previous;
            _disposed = true;
        }
    }
}
