using ArchLucid.Application;
using ArchLucid.Application.Authority;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Replay;

/// <inheritdoc cref="IReplayRunPrepareStage" />
public sealed class ReplayRunPrepareStage(
    IRunDetailQueryService runDetailQueryService,
    IArchitectureRequestRepository requestRepository,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IRunRepository authorityRunRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentTaskRepository taskRepository,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    IRunPolicyPackPinService runPolicyPackPinService,
    IRunEvidencePackagePinService runEvidencePackagePinService,
    IReplayRunCloneStage cloneStage,
    IReRunExecuteSealedManifestPinGate reRunExecuteSealedManifestPinGate) : IReplayRunPrepareStage
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IArchitectureRequestRepository _requestRepository =
        requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));

    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository =
        agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));

    private readonly IRunRepository _authorityRunRepository =
        authorityRunRepository ?? throw new ArgumentNullException(nameof(authorityRunRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentTaskRepository _taskRepository =
        taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly IRunPolicyPackPinService _runPolicyPackPinService =
        runPolicyPackPinService ?? throw new ArgumentNullException(nameof(runPolicyPackPinService));

    private readonly IRunEvidencePackagePinService _runEvidencePackagePinService =
        runEvidencePackagePinService ?? throw new ArgumentNullException(nameof(runEvidencePackagePinService));

    private readonly IReplayRunCloneStage _cloneStage =
        cloneStage ?? throw new ArgumentNullException(nameof(cloneStage));

    private readonly IReRunExecuteSealedManifestPinGate _reRunExecuteSealedManifestPinGate =
        reRunExecuteSealedManifestPinGate ?? throw new ArgumentNullException(nameof(reRunExecuteSealedManifestPinGate));

    /// <inheritdoc />
    public async Task<string> PrepareAsync(string originalRunId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(originalRunId);

        await ReplayRunPrepareSealedManifestHashGuard.EnsureSourceRunReadyOrThrowAsync(
            originalRunId,
            _reRunExecuteSealedManifestPinGate,
            cancellationToken).ConfigureAwait(false);

        ArchitectureRunDetail sourceDetail = await _runDetailQueryService.GetRunDetailAsync(originalRunId, cancellationToken) ??
                                             throw new RunNotFoundException(originalRunId);
        ArchitectureRun originalRun = sourceDetail.Run;
        List<AgentTask> tasks = sourceDetail.Tasks;
        cancellationToken.ThrowIfCancellationRequested();

        if (tasks.Count == 0 && !sourceDetail.AuthorityPipelineComplete)
        {
            bool authorityProgress = await SourceRunHasAuthorityStageProgressAsync(originalRunId, cancellationToken)
                .ConfigureAwait(false);

            if (!authorityProgress)
                throw new NoScheduledAgentTasksException(originalRunId);
        }

        ArchitectureRequest request = await _requestRepository.GetByIdAsync(originalRun.RequestId, cancellationToken) ??
                                      throw new InvalidOperationException($"Request '{originalRun.RequestId}' not found.");

        if (await _agentEvidencePackageRepository.GetByRunIdAsync(originalRunId, cancellationToken) is null)
            throw new InvalidOperationException($"Evidence package for run '{originalRunId}' not found.");

        string replayRunId = Guid.NewGuid().ToString("N");
        Guid replayGuid = Guid.Parse(replayRunId);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? sourceAuthorityRun = null;

        if (Guid.TryParse(originalRunId, out Guid originalGuid))
            sourceAuthorityRun = await _authorityRunRepository.GetByIdAsync(scope, originalGuid, cancellationToken);

        if (sourceAuthorityRun is null)
        {
            throw new ConflictException(
                $"Replay blocked for run '{originalRunId}': source run header was not found; create-time pins cannot be cloned.");
        }

        ReplayRunScopeAssertionGuard.EnsureCallerScopeMatchesSourceOrThrow(scope, sourceAuthorityRun, originalRunId);

        RunRecord replayAuthority = ReplayAuthorityRunRecordFactory.CreateForReplay(replayGuid, scope, sourceAuthorityRun, request);
        await _authorityRunRepository.SaveAsync(replayAuthority, cancellationToken);
        await _runPolicyPackPinService
            .VerifyPinIntegrityOrThrowAsync(replayAuthority, scope, cancellationToken)
            .ConfigureAwait(false);
        await _runEvidencePackagePinService
            .VerifyPinIntegrityOrThrowAsync(replayAuthority, scope, cancellationToken)
            .ConfigureAwait(false);
        cancellationToken.ThrowIfCancellationRequested();

        if (tasks.Count == 0)
            return replayRunId;

        List<AgentTask> replayTasks = _cloneStage.CloneTasksForReplay(tasks, replayRunId);

        // SimulatorExecutionTraceRecordingExecutor persists dbo.AgentExecutionTraces with FK_AgentExecutionTraces_Task.
        await _taskRepository.CreateManyAsync(replayTasks, cancellationToken);

        return replayRunId;
    }

    /// <inheritdoc />
    public async Task<bool> SourceRunHasAuthorityStageProgressAsync(
        string originalRunId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParseExact(originalRunId, "N", out Guid runGuid) && !Guid.TryParse(originalRunId, out runGuid))
            return false;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<StageTimelineSummary> stages =
            await _runStageOutcomesRepository.ListByRunIdAsync(runGuid, cancellationToken).ConfigureAwait(false);

        return stages.Count > 0;
    }
}
