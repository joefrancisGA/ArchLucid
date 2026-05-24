namespace ArchLucid.Contracts.Admin;

/// <summary>Process-life cache counters for operator diagnostics.</summary>
public sealed class AdminCacheDiagnosticsResponse
{
    public long HotPathReadCacheHits
    {
        get;
        init;
    }

    public long HotPathReadCacheMisses
    {
        get;
        init;
    }

    public long ExplanationCacheHits
    {
        get;
        init;
    }

    public long ExplanationCacheMisses
    {
        get;
        init;
    }

    public long LlmCompletionCacheHits
    {
        get;
        init;
    }

    public long LlmCompletionCacheMisses
    {
        get;
        init;
    }

    public long GraphProjectionCacheHits
    {
        get;
        init;
    }

    public long GraphProjectionCacheMisses
    {
        get;
        init;
    }

    public bool GraphProjectionCacheEnabled
    {
        get;
        init;
    }
}
