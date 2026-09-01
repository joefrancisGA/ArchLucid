using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QualityGates;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.AgentRuntime.Evaluation;

public sealed partial class AgentOutputEvaluationRecorder
{
    private async Task TryLogLlmFaithfulnessGateAuditAsync(
        string runId,
        AgentExecutionTrace trace,
        AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult evaluated,
        AgentOutputLlmFaithfulnessOptions faithfulnessOptions,
        CancellationToken cancellationToken)
    {
        if (!faithfulnessOptions.Enabled || !faithfulnessOptions.EnforcePhaseB)
            return;

        if (evaluated.Semantic.LlmFaithfulnessScore is not { } score)
            return;

        string? eventType = null;

        if (evaluated.GateOutcome == AgentOutputQualityGateOutcome.Rejected
            && score < faithfulnessOptions.MinScoreRejectBelow)
            eventType = AuditEventTypes.AgentOutputLlmFaithfulnessRejected;
        else if (evaluated.GateOutcome == AgentOutputQualityGateOutcome.Warned
                 && faithfulnessOptions.MinScoreWarnBelow is { } warnCeiling
                 && score >= faithfulnessOptions.MinScoreRejectBelow
                 && score < warnCeiling)
            eventType = AuditEventTypes.AgentOutputLlmFaithfulnessWarned;

        if (eventType is null)
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? auditRunId = Guid.TryParse(runId, out Guid runGuid) ? runGuid : null;

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = eventType,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = auditRunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    runId,
                    traceId = trace.TraceId,
                    agentType = trace.AgentType.ToString(),
                    llmFaithfulnessScore = score,
                    minScoreRejectBelow = faithfulnessOptions.MinScoreRejectBelow,
                    minScoreWarnBelow = faithfulnessOptions.MinScoreWarnBelow,
                    gateOutcome = evaluated.GateOutcome.ToString(),
                    evaluationReason = evaluated.EvaluationReason,
                }),
            },
            cancellationToken).ConfigureAwait(false);
    }
}
