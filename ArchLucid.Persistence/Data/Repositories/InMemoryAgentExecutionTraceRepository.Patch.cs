using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.QualityGates;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class InMemoryAgentExecutionTraceRepository
{
    /// <inheritdoc />
    public Task CreateAsync(AgentExecutionTrace trace, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(trace);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            _items.RemoveAll(existing => AgentExecutionTraceUpsertPolicy.ShouldRemoveExisting(existing, trace));
            _items.Add(Clone(trace));
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task PatchBlobStorageFieldsAsync(
        string traceId,
        string? fullSystemPromptBlobKey,
        string? fullUserPromptBlobKey,
        string? fullResponseBlobKey,
        CancellationToken cancellationToken = default) =>
        PatchLoadedTraceAsync(
            traceId,
            trace => AgentExecutionTraceQueryPatchCore.ApplyBlobStoragePatch(
                trace,
                fullSystemPromptBlobKey,
                fullUserPromptBlobKey,
                fullResponseBlobKey),
            cancellationToken);

    /// <inheritdoc />
    public Task PatchBlobUploadFailedAsync(
        string traceId,
        bool failed,
        CancellationToken cancellationToken = default) =>
        PatchLoadedTraceAsync(
            traceId,
            trace => AgentExecutionTraceQueryPatchCore.ApplyBlobUploadFailedPatch(trace, failed),
            cancellationToken);

    /// <inheritdoc />
    public Task PatchInlinePromptFallbackAsync(
        string traceId,
        string? fullSystemPromptInline,
        string? fullUserPromptInline,
        string? fullResponseInline,
        CancellationToken cancellationToken = default) =>
        PatchLoadedTraceAsync(
            traceId,
            trace => AgentExecutionTraceQueryPatchCore.ApplyInlinePromptFallbackPatch(
                trace,
                fullSystemPromptInline,
                fullUserPromptInline,
                fullResponseInline),
            cancellationToken);

    /// <inheritdoc />
    public Task PatchInlineFallbackFailedAsync(
        string traceId,
        bool failed,
        CancellationToken cancellationToken = default) =>
        PatchLoadedTraceAsync(
            traceId,
            trace => AgentExecutionTraceQueryPatchCore.ApplyInlineFallbackFailedPatch(trace, failed),
            cancellationToken);

    /// <inheritdoc />
    public Task PatchQualityWarningAsync(
        string traceId,
        bool qualityWarning,
        CancellationToken cancellationToken = default) =>
        PatchLoadedTraceAsync(
            traceId,
            trace => AgentExecutionTraceQueryPatchCore.ApplyQualityWarningPatch(trace, qualityWarning),
            cancellationToken);

    /// <inheritdoc />
    public Task PatchQualityRejectedAsync(
        string traceId,
        bool qualityRejected,
        CancellationToken cancellationToken = default) =>
        PatchLoadedTraceAsync(
            traceId,
            trace => AgentExecutionTraceQueryPatchCore.ApplyQualityRejectedPatch(trace, qualityRejected),
            cancellationToken);

    /// <inheritdoc />
    public Task PatchQualityGateRecordedSnapshotAsync(
        string traceId,
        AgentOutputQualityGateOutcome recordedOutcome,
        string definitionVersion,
        string definitionContentHashSha256,
        string gateMode,
        QualityGateRecordedEvaluationSnapshot? evaluationSnapshot,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(definitionVersion);
        ArgumentException.ThrowIfNullOrWhiteSpace(definitionContentHashSha256);
        ArgumentException.ThrowIfNullOrWhiteSpace(gateMode);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            int i = _items.FindIndex(t => string.Equals(t.TraceId, traceId, StringComparison.Ordinal));

            if (i < 0)
                return Task.CompletedTask;

            AgentExecutionTrace t = Clone(_items[i]);

            if (!AgentExecutionTraceQueryPatchCore.TryApplyQualityGateRecordedSnapshotPatch(
                    t,
                    recordedOutcome,
                    definitionVersion,
                    definitionContentHashSha256,
                    gateMode,
                    evaluationSnapshot))
            {
                return Task.CompletedTask;
            }

            _items[i] = t;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<int> HardDeleteTracesArchivedBeforeAsync(
        DateTimeOffset archivedBeforeUtc,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        _ = archivedBeforeUtc;
        _ = maxRows;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(0);
    }

    private Task PatchLoadedTraceAsync(
        string traceId,
        Action<AgentExecutionTrace> patch,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        ArgumentNullException.ThrowIfNull(patch);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            int i = _items.FindIndex(t => string.Equals(t.TraceId, traceId, StringComparison.Ordinal));

            if (i < 0)
                return Task.CompletedTask;

            AgentExecutionTrace t = Clone(_items[i]);
            patch(t);
            _items[i] = t;
        }

        return Task.CompletedTask;
    }

    private static AgentExecutionTrace Clone(AgentExecutionTrace source)
    {
        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        AgentExecutionTrace? copy = JsonSerializer.Deserialize<AgentExecutionTrace>(json, ContractJson.Default);

        return copy ?? throw new InvalidOperationException("Clone produced null AgentExecutionTrace.");
    }
}
