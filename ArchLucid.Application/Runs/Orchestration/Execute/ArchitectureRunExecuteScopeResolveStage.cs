using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecuteScopeResolveStage" />
public sealed class ArchitectureRunExecuteScopeResolveStage(
    IScopeContextProvider scopeContextProvider,
    IAgentResultRepository resultRepository,
    IRunStateTransitionService runStateTransitionService,
    IRunStageOutcomesRepository runStageOutcomesRepository) : IArchitectureRunExecuteScopeResolveStage
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentResultRepository _resultRepository =
        resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    /// <inheritdoc />
    public async Task ThrowIfAuthorityPipelineCompleteAsync(
        ArchitectureRun run,
        string runId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(run);

        if (!ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid))
            return;

        IReadOnlyList<StageTimelineSummary> stages =
            await _runStageOutcomesRepository.ListByRunIdAsync(runGuid, cancellationToken);

        if (!RunKernelCompleteness.IsAuthorityPipelineComplete(run.GoldenManifestId, manifest: null, stages))
            return;

        if (run.Status is ArchitectureRunStatus.Committed)
        {
            throw new ConflictException(
                $"Run '{runId}' is authority-pipeline complete and cannot be executed via the agent-task loop.");
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentResult> results =
            await _resultRepository.GetByRunIdAsync(scope, runId, cancellationToken, null, null);

        if (RunKernelCompleteness.IsAgentTaskLoopComplete(_runStateTransitionService, run.Status, results))
        {
            throw new ConflictException(
                $"Run '{runId}' is authority-pipeline complete and cannot be executed via the agent-task loop.");
        }
    }
}
