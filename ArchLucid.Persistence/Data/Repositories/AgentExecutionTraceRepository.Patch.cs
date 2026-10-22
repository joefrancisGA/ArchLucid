using System.Data;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.QualityGates;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class AgentExecutionTraceRepository
{
    /// <inheritdoc />
    public async Task PatchBlobStorageFieldsAsync(
        string traceId,
        string? fullSystemPromptBlobKey,
        string? fullUserPromptBlobKey,
        string? fullResponseBlobKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        // Each key is patched only when supplied, so a partial upload does not blank the keys it did not write.
        AgentExecutionTracePatch? patch = await AgentExecutionTraceJsonPatcher.TryMutateAsync(
            connection,
            traceId,
            trace =>
            {
                trace.FullSystemPromptBlobKey = fullSystemPromptBlobKey ?? trace.FullSystemPromptBlobKey;
                trace.FullUserPromptBlobKey = fullUserPromptBlobKey ?? trace.FullUserPromptBlobKey;
                trace.FullResponseBlobKey = fullResponseBlobKey ?? trace.FullResponseBlobKey;
            },
            cancellationToken);

        if (patch is null)
            return;

        // Columns take the post-merge values: this statement assigns unconditionally, unlike the COALESCE inline update.
        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateBlobStorageFields,
            new
            {
                TraceId = traceId,
                patch.Trace.FullSystemPromptBlobKey,
                patch.Trace.FullUserPromptBlobKey,
                patch.Trace.FullResponseBlobKey,
                TraceJson = patch.Json
            },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task PatchBlobUploadFailedAsync(
        string traceId,
        bool failed,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateBlobUploadFailed,
            new
            {
                TraceId = traceId,
                BlobUploadFailed = failed
            },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task PatchInlinePromptFallbackAsync(
        string traceId,
        string? fullSystemPromptInline,
        string? fullUserPromptInline,
        string? fullResponseInline,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AgentExecutionTracePatch? patch = await AgentExecutionTraceJsonPatcher.TryMutateAsync(
            connection,
            traceId,
            trace =>
            {
                trace.FullSystemPromptInline = fullSystemPromptInline ?? trace.FullSystemPromptInline;
                trace.FullUserPromptInline = fullUserPromptInline ?? trace.FullUserPromptInline;
                trace.FullResponseInline = fullResponseInline ?? trace.FullResponseInline;
            },
            cancellationToken);

        if (patch is null)
            return;

        // The statement COALESCEs each column, so unsupplied arguments leave the stored inline text alone.
        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateInlinePromptFallback,
            new
            {
                TraceId = traceId,
                FullSystemPromptInline = fullSystemPromptInline,
                FullUserPromptInline = fullUserPromptInline,
                FullResponseInline = fullResponseInline,
                TraceJson = patch.Json
            },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task PatchInlineFallbackFailedAsync(
        string traceId,
        bool failed,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        // Only the failure is recorded; success leaves the column NULL so "never attempted" and "succeeded" stay alike.
        bool? flag = failed ? true : null;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AgentExecutionTracePatch? patch = await AgentExecutionTraceJsonPatcher.TryMutateAsync(
            connection,
            traceId,
            trace => trace.InlineFallbackFailed = flag,
            cancellationToken);

        if (patch is null)
            return;

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateInlineFallbackFailed,
            new
            {
                TraceId = traceId,
                InlineFallbackFailed = flag,
                TraceJson = patch.Json
            },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task PatchQualityWarningAsync(
        string traceId,
        bool qualityWarning,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AgentExecutionTracePatch? patch = await AgentExecutionTraceJsonPatcher.TryMutateAsync(
            connection,
            traceId,
            trace => trace.QualityWarning = qualityWarning,
            cancellationToken);

        if (patch is null)
            return;

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateQualityWarning,
            new
            {
                TraceId = traceId,
                TraceJson = patch.Json,
                QualityWarning = qualityWarning
            },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task PatchQualityRejectedAsync(
        string traceId,
        bool qualityRejected,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AgentExecutionTracePatch? patch = await AgentExecutionTraceJsonPatcher.TryMutateAsync(
            connection,
            traceId,
            trace => trace.QualityRejected = qualityRejected,
            cancellationToken);

        if (patch is null)
            return;

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateQualityRejected,
            new
            {
                TraceId = traceId,
                TraceJson = patch.Json,
                QualityRejected = qualityRejected
            },
            cancellationToken: cancellationToken));
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
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(definitionVersion);
        ArgumentException.ThrowIfNullOrWhiteSpace(definitionContentHashSha256);
        ArgumentException.ThrowIfNullOrWhiteSpace(gateMode);

        bool qualityWarning = recordedOutcome == AgentOutputQualityGateOutcome.Warned;
        bool qualityRejected = recordedOutcome == AgentOutputQualityGateOutcome.Rejected;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        // First outcome wins: the read filter and the write predicate both require an unrecorded outcome.
        AgentExecutionTracePatch? patch = await AgentExecutionTraceJsonPatcher.TryMutateUnrecordedQualityGateAsync(
            connection,
            traceId,
            trace =>
            {
                trace.QualityWarning = qualityWarning;
                trace.QualityRejected = qualityRejected;
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
            },
            cancellationToken);

        if (patch is null)
            return;

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateQualityGateRecordedSnapshot,
            new
            {
                TraceId = traceId,
                TraceJson = patch.Json,
                QualityWarning = qualityWarning,
                QualityRejected = qualityRejected,
                QualityGateDefinitionVersion = definitionVersion,
                QualityGateDefinitionContentHashSha256 = definitionContentHashSha256,
                RecordedQualityGateOutcome = (byte)recordedOutcome,
                RecordedStructuralCompletenessRatio = evaluationSnapshot?.StructuralCompletenessRatio,
                RecordedSemanticScore = evaluationSnapshot?.SemanticScore,
                RecordedRejectReasonCategory = evaluationSnapshot?.RejectReasonCategory,
                RecordedTriageScenarioId = evaluationSnapshot?.TriageScenarioId,
            },
            cancellationToken: cancellationToken));
    }
}
