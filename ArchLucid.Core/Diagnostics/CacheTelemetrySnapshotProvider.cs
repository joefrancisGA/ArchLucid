namespace ArchLucid.Core.Diagnostics;

/// <inheritdoc cref="ICacheTelemetrySnapshotProvider" />
public sealed class CacheTelemetrySnapshotProvider : ICacheTelemetrySnapshotProvider
{
    private readonly Func<bool>? _graphProjectionCacheEnabledReader;

    public CacheTelemetrySnapshotProvider(Func<bool>? graphProjectionCacheEnabledReader = null)
    {
        _graphProjectionCacheEnabledReader = graphProjectionCacheEnabledReader;
    }

    /// <inheritdoc />
    public CacheTelemetrySnapshot GetSnapshot()
    {
        CacheTelemetrySnapshot snapshot = ArchLucidInstrumentation.GetCacheTelemetrySnapshot();

        if (_graphProjectionCacheEnabledReader is null)
            return snapshot;

        return new CacheTelemetrySnapshot
        {
            HotPathReadCacheHits = snapshot.HotPathReadCacheHits,
            HotPathReadCacheMisses = snapshot.HotPathReadCacheMisses,
            ExplanationCacheHits = snapshot.ExplanationCacheHits,
            ExplanationCacheMisses = snapshot.ExplanationCacheMisses,
            LlmCompletionCacheHits = snapshot.LlmCompletionCacheHits,
            LlmCompletionCacheMisses = snapshot.LlmCompletionCacheMisses,
            GraphProjectionCacheHits = snapshot.GraphProjectionCacheHits,
            GraphProjectionCacheMisses = snapshot.GraphProjectionCacheMisses,
            GraphProjectionCacheEnabled = _graphProjectionCacheEnabledReader(),
        };
    }
}
