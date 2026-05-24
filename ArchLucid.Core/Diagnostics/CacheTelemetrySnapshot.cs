namespace ArchLucid.Core.Diagnostics;

/// <summary>Process-life cumulative cache counters for operator diagnostics.</summary>
public sealed class CacheTelemetrySnapshot
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
