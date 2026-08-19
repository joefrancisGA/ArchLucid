namespace ArchLucid.AgentRuntime.Batch;

/// <summary>Default ambient batch-routing context (interactive paths stay synchronous).</summary>
public sealed class LlmBatchRoutingContext : ILlmBatchRoutingContext
{
    private static readonly AsyncLocal<bool> UseBatchPathAmbient = new();

    public static readonly LlmBatchRoutingContext Instance = new();

    public bool UseBatchPath => UseBatchPathAmbient.Value;

    public static IDisposable BeginOfflineBatchPath()
    {
        bool previous = UseBatchPathAmbient.Value;
        UseBatchPathAmbient.Value = true;

        return new Scope(previous);
    }

    private sealed class Scope : IDisposable
    {
        private readonly bool _previous;
        private bool _disposed;

        public Scope(bool previous)
        {
            _previous = previous;
        }

        public void Dispose()
        {
            if (_disposed)
                return;

            UseBatchPathAmbient.Value = _previous;
            _disposed = true;
        }
    }
}
