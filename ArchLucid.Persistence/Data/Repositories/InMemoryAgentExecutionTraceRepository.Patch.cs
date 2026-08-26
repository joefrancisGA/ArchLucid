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
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            int i = _items.FindIndex(t => string.Equals(t.TraceId, traceId, StringComparison.Ordinal));

            if (i < 0)
                return Task.CompletedTask;

            AgentExecutionTrace t = Clone(_items[i]);

            if (fullSystemPromptBlobKey is not null)

                t.FullSystemPromptBlobKey = fullSystemPromptBlobKey;

            if (fullUserPromptBlobKey is not null)

                t.FullUserPromptBlobKey = fullUserPromptBlobKey;

            if (fullResponseBlobKey is not null)

                t.FullResponseBlobKey = fullResponseBlobKey;

            _items[i] = t;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task PatchBlobUploadFailedAsync(
        string traceId,
        bool failed,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            int i = _items.FindIndex(t => string.Equals(t.TraceId, traceId, StringComparison.Ordinal));

            if (i < 0)
                return Task.CompletedTask;

            {
                AgentExecutionTrace t = Clone(_items[i]);
                t.BlobUploadFailed = failed;
                _items[i] = t;
            }
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task PatchInlinePromptFallbackAsync(
        string traceId,
        string? fullSystemPromptInline,
        string? fullUserPromptInline,
        string? fullResponseInline,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            int i = _items.FindIndex(t => string.Equals(t.TraceId, traceId, StringComparison.Ordinal));

            if (i < 0)
                return Task.CompletedTask;

            AgentExecutionTrace t = Clone(_items[i]);

            if (fullSystemPromptInline is not null)

                t.FullSystemPromptInline = fullSystemPromptInline;

            if (fullUserPromptInline is not null)

                t.FullUserPromptInline = fullUserPromptInline;

            if (fullResponseInline is not null)

                t.FullResponseInline = fullResponseInline;

            _items[i] = t;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task PatchInlineFallbackFailedAsync(
        string traceId,
        bool failed,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            int i = _items.FindIndex(t => string.Equals(t.TraceId, traceId, StringComparison.Ordinal));

            if (i < 0)
                return Task.CompletedTask;

            {
                AgentExecutionTrace t = Clone(_items[i]);
                t.InlineFallbackFailed = failed ? true : null;
                _items[i] = t;
            }
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task PatchQualityWarningAsync(
        string traceId,
        bool qualityWarning,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            int i = _items.FindIndex(t => string.Equals(t.TraceId, traceId, StringComparison.Ordinal));

            if (i < 0)
                return Task.CompletedTask;

            AgentExecutionTrace t = Clone(_items[i]);
            t.QualityWarning = qualityWarning;
            _items[i] = t;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task PatchQualityRejectedAsync(
        string traceId,
        bool qualityRejected,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            int i = _items.FindIndex(t => string.Equals(t.TraceId, traceId, StringComparison.Ordinal));

            if (i < 0)
                return Task.CompletedTask;

            AgentExecutionTrace t = Clone(_items[i]);
            t.QualityRejected = qualityRejected;
            _items[i] = t;
        }

        return Task.CompletedTask;
    }

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

            AgentExecutionTrace existing = _items[i];

            if (existing.RecordedQualityGateOutcome is not null)
                return Task.CompletedTask;

            AgentExecutionTrace t = Clone(existing);
            t.QualityWarning = recordedOutcome == AgentOutputQualityGateOutcome.Warned;
            t.QualityRejected = recordedOutcome == AgentOutputQualityGateOutcome.Rejected;
            t.QualityGateDefinitionVersion = definitionVersion;
            t.QualityGateDefinitionContentHashSha256 = definitionContentHashSha256;
            t.QualityGateDefinitionMode = gateMode;
            t.RecordedQualityGateOutcome = recordedOutcome;

            if (evaluationSnapshot is not null)
            {
                t.RecordedStructuralCompletenessRatio = evaluationSnapshot.StructuralCompletenessRatio;
                t.RecordedSemanticScore = evaluationSnapshot.SemanticScore;
                t.RecordedRejectReasonCategory = evaluationSnapshot.RejectReasonCategory;
                t.RecordedTriageScenarioId = evaluationSnapshot.TriageScenarioId;
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

    private static AgentExecutionTrace Clone(AgentExecutionTrace source)
    {
        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        AgentExecutionTrace? copy = JsonSerializer.Deserialize<AgentExecutionTrace>(json, ContractJson.Default);

        return copy ?? throw new InvalidOperationException("Clone produced null AgentExecutionTrace.");
    }
}
