using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.QualityGates;

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
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        trace.FullSystemPromptBlobKey = fullSystemPromptBlobKey ?? trace.FullSystemPromptBlobKey;
        trace.FullUserPromptBlobKey = fullUserPromptBlobKey ?? trace.FullUserPromptBlobKey;
        trace.FullResponseBlobKey = fullResponseBlobKey ?? trace.FullResponseBlobKey;
        await ReplaceTraceAsync(trace, cancellationToken);
    }

    /// <inheritdoc />
    public async Task PatchBlobUploadFailedAsync(string traceId, bool failed,
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        trace.BlobUploadFailed = failed ? true : null;
        await ReplaceTraceAsync(trace, cancellationToken);
    }

    /// <inheritdoc />
    public async Task PatchInlinePromptFallbackAsync(
        string traceId,
        string? fullSystemPromptInline,
        string? fullUserPromptInline,
        string? fullResponseInline,
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        if (fullSystemPromptInline is not null)
            trace.FullSystemPromptInline = fullSystemPromptInline;

        if (fullUserPromptInline is not null)
            trace.FullUserPromptInline = fullUserPromptInline;

        if (fullResponseInline is not null)
            trace.FullResponseInline = fullResponseInline;

        await ReplaceTraceAsync(trace, cancellationToken);
    }

    /// <inheritdoc />
    public async Task PatchInlineFallbackFailedAsync(string traceId, bool failed,
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        trace.InlineFallbackFailed = failed ? true : null;
        await ReplaceTraceAsync(trace, cancellationToken);
    }

    /// <inheritdoc />
    public async Task PatchQualityWarningAsync(string traceId, bool qualityWarning,
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        trace.QualityWarning = qualityWarning;
        await ReplaceTraceAsync(trace, cancellationToken);
    }

    /// <inheritdoc />
    public async Task PatchQualityRejectedAsync(string traceId, bool qualityRejected,
        CancellationToken cancellationToken = default)
    {
        AgentExecutionTrace? trace = await LoadTraceAsync(traceId, cancellationToken);

        if (trace is null)
            return;

        trace.QualityRejected = qualityRejected;
        await ReplaceTraceAsync(trace, cancellationToken);
    }

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

        if (trace is null || trace.RecordedQualityGateOutcome is not null)
            return;

        trace.QualityWarning = recordedOutcome == AgentOutputQualityGateOutcome.Warned;
        trace.QualityRejected = recordedOutcome == AgentOutputQualityGateOutcome.Rejected;
        trace.QualityGateDefinitionVersion = definitionVersion;
        trace.QualityGateDefinitionContentHashSha256 = definitionContentHashSha256;
        trace.QualityGateDefinitionMode = gateMode;
        trace.RecordedQualityGateOutcome = recordedOutcome;

        if (evaluationSnapshot is not null)
        {
            trace.RecordedStructuralCompletenessRatio = evaluationSnapshot.StructuralCompletenessRatio;
            trace.RecordedSemanticScore = evaluationSnapshot.SemanticScore;
            trace.RecordedRejectReasonCategory = evaluationSnapshot.RejectReasonCategory;
            trace.RecordedTriageScenarioId = evaluationSnapshot.TriageScenarioId;
        }

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
