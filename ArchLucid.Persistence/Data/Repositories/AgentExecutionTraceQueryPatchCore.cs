using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.QualityGates;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Shared agent-execution-trace query paging and patch semantics for SQL, in-memory, and Cosmos repositories.
/// </summary>
internal static class AgentExecutionTraceQueryPatchCore
{
    public const int MaxPageSize = 500;

    public static int ClampPageLimit(int limit) => Math.Clamp(limit, 1, MaxPageSize);

    public static int ClampPageOffset(int offset) => Math.Max(0, offset);

    public static List<string> NormalizeRunIds(IEnumerable<string> runIds)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        return runIds
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public static AgentExecutionTraceLlmCostSlice ToLlmCostSlice(AgentExecutionTrace trace)
    {
        ArgumentNullException.ThrowIfNull(trace);

        return new AgentExecutionTraceLlmCostSlice
        {
            ModelDeploymentName = trace.ModelDeploymentName,
            InputTokenCount = trace.InputTokenCount,
            OutputTokenCount = trace.OutputTokenCount,
            ReasoningTokenCount = trace.ReasoningTokenCount,
        };
    }

    public static (IReadOnlyList<T> Page, int TotalCount) PageInMemory<T>(
        IReadOnlyList<T> ordered,
        int offset,
        int limit)
    {
        ArgumentNullException.ThrowIfNull(ordered);

        int total = ordered.Count;
        int clampedOffset = ClampPageOffset(offset);
        int clampedLimit = ClampPageLimit(limit);
        List<T> page = ordered.Skip(clampedOffset).Take(clampedLimit).ToList();

        return (page, total);
    }

    public static void ApplyBlobStoragePatch(
        AgentExecutionTrace trace,
        string? fullSystemPromptBlobKey,
        string? fullUserPromptBlobKey,
        string? fullResponseBlobKey)
    {
        ArgumentNullException.ThrowIfNull(trace);

        if (fullSystemPromptBlobKey is not null)
            trace.FullSystemPromptBlobKey = fullSystemPromptBlobKey;

        if (fullUserPromptBlobKey is not null)
            trace.FullUserPromptBlobKey = fullUserPromptBlobKey;

        if (fullResponseBlobKey is not null)
            trace.FullResponseBlobKey = fullResponseBlobKey;
    }

    public static void ApplyBlobUploadFailedPatch(AgentExecutionTrace trace, bool failed)
    {
        ArgumentNullException.ThrowIfNull(trace);
        trace.BlobUploadFailed = failed ? true : null;
    }

    public static void ApplyInlinePromptFallbackPatch(
        AgentExecutionTrace trace,
        string? fullSystemPromptInline,
        string? fullUserPromptInline,
        string? fullResponseInline)
    {
        ArgumentNullException.ThrowIfNull(trace);

        if (fullSystemPromptInline is not null)
            trace.FullSystemPromptInline = fullSystemPromptInline;

        if (fullUserPromptInline is not null)
            trace.FullUserPromptInline = fullUserPromptInline;

        if (fullResponseInline is not null)
            trace.FullResponseInline = fullResponseInline;
    }

    public static void ApplyInlineFallbackFailedPatch(AgentExecutionTrace trace, bool failed)
    {
        ArgumentNullException.ThrowIfNull(trace);
        trace.InlineFallbackFailed = failed ? true : null;
    }

    public static void ApplyQualityWarningPatch(AgentExecutionTrace trace, bool qualityWarning)
    {
        ArgumentNullException.ThrowIfNull(trace);
        trace.QualityWarning = qualityWarning;
    }

    public static void ApplyQualityRejectedPatch(AgentExecutionTrace trace, bool qualityRejected)
    {
        ArgumentNullException.ThrowIfNull(trace);
        trace.QualityRejected = qualityRejected;
    }

    /// <summary>
    ///     First outcome wins: returns false when the trace already recorded a quality-gate outcome.
    /// </summary>
    public static bool TryApplyQualityGateRecordedSnapshotPatch(
        AgentExecutionTrace trace,
        AgentOutputQualityGateOutcome recordedOutcome,
        string definitionVersion,
        string definitionContentHashSha256,
        string gateMode,
        QualityGateRecordedEvaluationSnapshot? evaluationSnapshot)
    {
        ArgumentNullException.ThrowIfNull(trace);

        if (trace.RecordedQualityGateOutcome is not null)
            return false;

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

        return true;
    }
}
