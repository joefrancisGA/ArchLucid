using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Contracts.Common;using ArchLucid.Application.Decisions;using ArchLucid.Application.Common;using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

public sealed class AgentLoopPersistStage(
    IAgentResultPostExecutionEnricher enricher,
    IAgentEvaluationService evaluationService,
    IArchitectureRunExecutePersistenceStage persistenceStage,
    IArchitectureRunExecuteQualityGateStage qualityGateStage,
    IRunEngineProvenanceCaptureService provenanceCaptureService,
    IExecuteTimeGovernanceScopeCaptureService governanceScopeCaptureService,
    IArchitectureRunExecutePreExecuteStage preExecuteStage,
    TechnologyLedgerTopologyProposalSeeder topologySeeder,
    IBaselineMutationAuditService baselineMutationAudit,
    ILogger<AgentLoopPersistStage> logger) : IAgentLoopPersistStage
{
    public async Task<ExecuteRunResult> PersistAsync(AgentLoopPreparedBatch prepared, IReadOnlyList<AgentResult> results, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(prepared);
        ArgumentNullException.ThrowIfNull(results);
        await enricher.EnrichAsync(prepared.RunId, prepared.Request, prepared.Evidence, results, cancellationToken);
        await SeedTopologyAsync(prepared.RunId, prepared.Request, results, cancellationToken);
        var evaluations = await evaluationService.EvaluateAsync(prepared.RunId, prepared.Request, prepared.Evidence, prepared.Tasks, results, cancellationToken);
        await persistenceStage.PersistExecutePhaseAsync(prepared.Evidence, results, evaluations, cancellationToken);
        if (ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(prepared.RunId, out Guid runId))
            logger.LogInformationAgentExecutionStateTransition(runId, "agent_results_persisting", "execute_complete", prepared.ScheduledTaskIds);
        results = await qualityGateStage.RunQualityGateTraceEvaluationLoopAsync(prepared.RunId, prepared.Actor, prepared.Request, prepared.Evidence, prepared.Tasks, results, cancellationToken);
        await TryCaptureAsync(provenanceCaptureService.TryCaptureAndPersistAsync(prepared.RunId, prepared.Evidence, cancellationToken), prepared.RunId, "Engine provenance");
        await TryCaptureAsync(governanceScopeCaptureService.TryCaptureAndPersistAsync(prepared.RunId, prepared.Request, cancellationToken), prepared.RunId, "Governance scope");
        await preExecuteStage.TryApplyExecuteCompletionLegacyStatusAsync(prepared.RunId, results, cancellationToken);
        await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunExecuteSucceeded, prepared.Actor, prepared.RunId, $"ResultCount={results.Count}", cancellationToken);
        return new ExecuteRunResult { RunId = prepared.RunId, Results = results.ToList() };
    }

    private async Task SeedTopologyAsync(string runId, ArchitectureRequest request, IReadOnlyList<AgentResult> results, CancellationToken ct)
    {
        var topology = results.FirstOrDefault(r => r.AgentType == AgentType.Topology);
        if (topology is null) return;
        await TryCaptureAsync(topologySeeder.SeedFromTopologyResultAsync(runId, request, topology, ct), runId, "Technology Ledger topology proposal seeding");
    }

    private async Task TryCaptureAsync(Task task, string runId, string label)
    {
        try { await task; }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning(ex, "{Label} failed for RunId={RunId}; execute outcome unchanged.", label, LogSanitizer.Sanitize(runId));
        }
    }
}
