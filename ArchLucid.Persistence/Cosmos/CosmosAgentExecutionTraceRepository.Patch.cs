using System.Net;
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
    private const int MaxTracePatchAttempts = 3;

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
        CancellationToken cancellationToken = default) =>
        await PatchLoadedTraceIfChangedAsync(
            traceId,
            trace => AgentExecutionTraceQueryPatchCore.TryApplyQualityGateRecordedSnapshotPatch(
                trace, recordedOutcome, definitionVersion, definitionContentHashSha256, gateMode, evaluationSnapshot),
            cancellationToken);

    private Task PatchLoadedTraceAsync(
        string traceId,
        Action<AgentExecutionTrace> patch,
        CancellationToken cancellationToken) =>
        PatchLoadedTraceIfChangedAsync(
            traceId,
            trace =>
            {
                patch(trace);
                return true;
            },
            cancellationToken);

    private async Task PatchLoadedTraceIfChangedAsync(
        string traceId, Func<AgentExecutionTrace, bool> patch, CancellationToken ct)
    {
        AgentTraceDocument? located = await FindDocumentByTraceIdAsync(traceId, ct);

        if (located is null)
            return;

        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        CosmosDbOptions opts = _optionsMonitor.CurrentValue;
        int? ttl = opts.AgentTraceTtlSeconds > 0 ? opts.AgentTraceTtlSeconds : null;

        await PatchDocumentAsync(container, located.Id, new PartitionKey(located.RunId), ttl, patch, ct);
    }

    internal static async Task PatchDocumentAsync(
        Container container,
        string id,
        PartitionKey partitionKey,
        int? ttl,
        Func<AgentExecutionTrace, bool> patch,
        CancellationToken ct)
    {
        for (int attempt = 1; ; attempt++)
        {
            ItemResponse<AgentTraceDocument> current;

            try
            {
                current = await container.ReadItemAsync<AgentTraceDocument>(id, partitionKey, cancellationToken: ct);
            }
            catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                return;
            }

            AgentExecutionTrace trace = CosmosAgentTraceDocumentMapper.Deserialize(current.Resource);

            if (!patch(trace))
                return;

            string json = JsonSerializer.Serialize(trace, ContractJson.Default);
            AgentTraceDocument updated = CosmosAgentTraceDocumentMapper.BuildDocument(trace, json, ttl);

            try
            {
                await container.ReplaceItemAsync(
                    updated, id, partitionKey, new ItemRequestOptions { IfMatchEtag = current.ETag }, ct);
                return;
            }
            catch (CosmosException ex) when (
                ex.StatusCode == HttpStatusCode.PreconditionFailed && attempt < MaxTracePatchAttempts)
            {
                // Reapply this patch to the document written by the competing update.
            }
        }
    }
}
