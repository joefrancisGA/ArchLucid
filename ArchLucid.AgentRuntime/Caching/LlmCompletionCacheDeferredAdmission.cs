using ArchLucid.Core.Diagnostics;

namespace ArchLucid.AgentRuntime.Caching;

/// <summary>
///     Defers cache writes until schema admission succeeds; busts cache-served poison on schema failure (TB-940).
/// </summary>
/// <remarks>
///     Pending state is stored on a reference-type box created by <see cref="EnterSchemaAdmissionGate" /> so mutations
///     inside <see cref="CachingLlmCompletionClient.CompleteJsonAsync" /> remain visible to the caller after await
///     (AsyncLocal value replacements inside the callee do not flow back out).
/// </remarks>
public static class LlmCompletionCacheDeferredAdmission
{
    private static readonly AsyncLocal<AdmissionBox?> BoxLocal = new();

    /// <summary>True while a schema-admission gate is active on this async flow.</summary>
    public static bool IsSchemaAdmissionRequired => BoxLocal.Value is { GateDepth: > 0 };

    /// <summary>True when a wire body is staged and waiting for commit or bust.</summary>
    public static bool HasPending => BoxLocal.Value?.Pending is not null;

    /// <summary>Peek the staged cache key (tests / diagnostics).</summary>
    public static LlmCompletionCacheKey? PeekPendingKey => BoxLocal.Value?.Pending?.Key;

    /// <summary>Enters a schema-admission gate for the current async flow.</summary>
    public static IDisposable EnterSchemaAdmissionGate()
    {
        AdmissionBox box = BoxLocal.Value ?? new AdmissionBox();
        box.GateDepth++;
        BoxLocal.Value = box;

        return new GateScope(box);
    }

    /// <summary>Stages a wire body for later <see cref="CommitAsync" /> (or bust on schema failure).</summary>
    public static void Stage(
        ILlmCompletionResponseCache cache,
        LlmCompletionCacheKey key,
        string jsonBody,
        bool servedFromCache,
        string agentTypeLabel)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentException.ThrowIfNullOrWhiteSpace(jsonBody);

        AdmissionBox? box = BoxLocal.Value;

        if (box is null || box.GateDepth < 1)
            return;

        box.Pending = new PendingEntry(cache, key, jsonBody, servedFromCache, NormalizeAgentType(agentTypeLabel));
    }

    /// <summary>Persists the staged body after schema/quality admission succeeds.</summary>
    public static async Task CommitAsync(CancellationToken cancellationToken = default)
    {
        AdmissionBox? box = BoxLocal.Value;
        PendingEntry? pending = box?.Pending;

        if (box is null || pending is null)
            return;

        box.Pending = null;

        // Cache-hit bodies are already persisted; admission success only clears the stage.
        if (pending.ServedFromCache)
            return;

        if (!LlmCompletionCacheWireAdmission.IsAdmissible(pending.JsonBody))
            return;

        await pending.Cache
            .SetAsync(pending.Key, new LlmCompletionResult(pending.JsonBody), cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    ///     On schema failure: remove cache-served poison and record metrics; otherwise drop the staged miss body.
    /// </summary>
    public static async Task DiscardOrBustOnSchemaFailureAsync(CancellationToken cancellationToken = default)
    {
        AdmissionBox? box = BoxLocal.Value;
        PendingEntry? pending = box?.Pending;

        if (box is null || pending is null)
            return;

        box.Pending = null;

        if (!pending.ServedFromCache)
            return;

        await pending.Cache.RemoveAsync(pending.Key, cancellationToken).ConfigureAwait(false);

        ArchLucidInstrumentation.RecordLlmCompletionCachePoisonBust(pending.AgentTypeLabel);
    }

    /// <summary>Clears any staged entry without writing or busting (test / abort paths).</summary>
    public static void ClearPending()
    {
        AdmissionBox? box = BoxLocal.Value;

        if (box is not null)
            box.Pending = null;
    }

    private static string NormalizeAgentType(string agentTypeLabel)
    {
        return string.IsNullOrWhiteSpace(agentTypeLabel) ? "unknown" : agentTypeLabel.Trim();
    }

    private sealed class AdmissionBox
    {
        public int GateDepth
        {
            get;
            set;
        }

        public PendingEntry? Pending
        {
            get;
            set;
        }
    }

    private sealed class GateScope(AdmissionBox box) : IDisposable
    {
        private bool _disposed;

        public void Dispose()
        {
            if (_disposed)
                return;

            _disposed = true;

            if (box.GateDepth > 0)
                box.GateDepth--;

            if (box.GateDepth == 0)
                box.Pending = null;
        }
    }

    private sealed record PendingEntry(
        ILlmCompletionResponseCache Cache,
        LlmCompletionCacheKey Key,
        string JsonBody,
        bool ServedFromCache,
        string AgentTypeLabel);
}
