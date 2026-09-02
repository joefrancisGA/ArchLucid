using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.QualityGates;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Cosmos;

public sealed partial class CosmosAgentExecutionTraceRepository
{
    /// <inheritdoc />
    public async Task PatchBlobStorageFieldsAsync(
        string traceId,
        string? fullSystemPromptBlobKey,
        string? fullUserPromptBlobKey,
        string? fullResponseBlobKey,
        CancellationToken cancellationToken = default) =>
        await PatchLoadedTraceAsync(
            traceId,
            trace => AgentExecutionTraceQueryPatchCore.ApplyBlobStoragePatch(
                trace,
                fullSystemPromptBlobKey,
                fullUserPromptBlobKey,
                fullResponseBlobKey),
            cancellationToken);

    /// <inheritdoc />
    public async Task PatchBlobUploadFailedAsync(string traceId, bool failed,
        CancellationToken cancellationToken = default) =>
        await PatchLoadedTraceAsync(
            traceId,
            trace => AgentExecutionTraceQueryPatchCore.ApplyBlobUploadFailedPatch(trace, failed),
            cancellationToken);

    /// <inheritdoc />
    public async Task PatchInlinePromptFallbackAsync(
        string traceId,
        string? fullSystemPromptInline,
        string? fullUserPromptInline,
        string? fullResponseInline,
        CancellationToken cancellationToken = default) =>
        await PatchLoadedTraceAsync(
            traceId,
            trace => AgentExecutionTraceQueryPatchCore.ApplyInlinePromptFallbackPatch(
                trace,
                fullSystemPromptInline,
                fullUserPromptInline,
                fullResponseInline),
            cancellationToken);

    /// <inheritdoc />
    public async Task PatchInlineFallbackFailedAsync(string traceId, bool failed,
        CancellationToken cancellationToken = default) =>
        await PatchLoadedTraceAsync(
            traceId,
            trace => AgentExecutionTraceQueryPatchCore.ApplyInlineFallbackFailedPatch(trace, failed),
            cancellationToken);

    /// <inheritdoc />
    public async Task PatchQualityWarningAsync(string traceId, bool qualityWarning,
        CancellationToken cancellationToken = default) =>
        await PatchLoadedTraceAsync(
            traceId,
            trace => AgentExecutionTraceQueryPatchCore.ApplyQualityWarningPatch(trace, qualityWarning),
            cancellationToken);

    /// <inheritdoc />
    public async Task PatchQualityRejectedAsync(string traceId, bool qualityRejected,
        CancellationToken cancellationToken = default) =>
        await PatchLoadedTraceAsync(
            traceId,
            trace => AgentExecutionTraceQueryPatchCore.ApplyQualityRejectedPatch(trace, qualityRejected),
            cancellationToken);

    /// <inheritdoc />
    public async Task PatchQualityGateRecordedSnapshotAsync(
        string traceId,
        AgentOutputQualityGateOutcome recordedOutcome,
        string definitionVersion,
        string definitionContentHashSha256,
        string gateMode,
        QualityGateRecordedEvaluationSnapshot? evaluationSnapshot,
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        if (!AgentExecutionTraceQueryPatchCore.TryApplyQualityGateRecordedSnapshotPatch(
                trace,
                recordedOutcome,
                definitionVersion,
                definitionContentHashSha256,
                gateMode,
                evaluationSnapshot))
        {
            return;
        }

        await ReplaceTraceAsync(trace, cancellationToken);
    }

    private async Task PatchLoadedTraceAsync(
        string traceId,
        Action<AgentExecutionTrace> patch,
        CancellationToken cancellationToken)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        patch(trace);
        await ReplaceTraceAsync(trace, cancellationToken);
    }

    private async Task ReplaceTraceAsync(AgentExecutionTrace trace, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(trace);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        CosmosDbOptions opts = _optionsMonitor.CurrentValue;
        int? ttl = opts.AgentTraceTtlSeconds > 0 ? opts.AgentTraceTtlSeconds : null;
        string json = JsonSerializer.Serialize(trace, ContractJson.Default);
        AgentTraceDocument doc = CosmosAgentTraceDocumentMapper.BuildDocument(trace, json, ttl);

        await container.ReplaceItemAsync(doc, trace.TraceId, new PartitionKey(trace.RunId), cancellationToken: ct);
    }

    private async Task<AgentExecutionTrace?> LoadTraceAsync(string traceId, CancellationToken ct)
    {
        AgentTraceDocument? doc = await FindDocumentByTraceIdAsync(traceId, ct);

        return doc is null ? null : CosmosAgentTraceDocumentMapper.Deserialize(doc);
    }
}
