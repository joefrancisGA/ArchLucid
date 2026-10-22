using ArchLucid.Application.Common;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

public sealed class AgentLoopPrepareStage(
    IArchitectureRequestRepository requestRepository,
    IRequestContentSafetyPrecheck requestContentSafetyPrecheck,
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IRunGovernanceScopePinService runGovernanceScopePinService,
    IAgentTaskRepository taskRepository,
    IEvidenceBuilder evidenceBuilder,
    IEvidencePackageInjectionMitigator evidencePackageInjectionMitigator,
    IAgentEvidenceUntrustedInputSanitizer agentEvidenceUntrustedInputSanitizer,
    ILogger<AgentLoopPrepareStage> logger) : IAgentLoopPrepareStage
{
    private readonly IArchitectureRequestRepository _requestRepository =
        requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));
    private readonly IRequestContentSafetyPrecheck _requestContentSafetyPrecheck =
        requestContentSafetyPrecheck ?? throw new ArgumentNullException(nameof(requestContentSafetyPrecheck));
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IRunGovernanceScopePinService _runGovernanceScopePinService =
        runGovernanceScopePinService ?? throw new ArgumentNullException(nameof(runGovernanceScopePinService));

    private readonly IAgentTaskRepository _taskRepository =
        taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));
    private readonly IEvidenceBuilder _evidenceBuilder =
        evidenceBuilder ?? throw new ArgumentNullException(nameof(evidenceBuilder));
    private readonly IEvidencePackageInjectionMitigator _evidencePackageInjectionMitigator =
        evidencePackageInjectionMitigator ?? throw new ArgumentNullException(nameof(evidencePackageInjectionMitigator));
    private readonly IAgentEvidenceUntrustedInputSanitizer _agentEvidenceUntrustedInputSanitizer =
        agentEvidenceUntrustedInputSanitizer ?? throw new ArgumentNullException(nameof(agentEvidenceUntrustedInputSanitizer));
    private readonly ILogger<AgentLoopPrepareStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<AgentLoopPreparedBatch> PrepareAsync(
        ArchitectureRun run, string runId, string actor, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(run);
        if (string.IsNullOrWhiteSpace(runId)) throw new ArgumentException("Run id is required.", nameof(runId));
        if (string.IsNullOrWhiteSpace(actor)) throw new ArgumentException("Actor is required.", nameof(actor));

        ArchitectureRequest request = await _requestRepository.GetByIdAsync(run.RequestId, cancellationToken) ??
            throw new InvalidOperationException($"Request '{run.RequestId}' not found.");
        RequestContentSafetyResult safety = await _requestContentSafetyPrecheck.EvaluateAsync(request, cancellationToken);
        if (!safety.IsAllowed) throw new RequestContentSafetyRejectedException(safety.Reasons);

        ScopeContext executeScope = _scopeContextProvider.GetCurrentScope();

        Persistence.Models.RunRecord? runHeader = null;

        if (ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid))
        {
            runHeader = await _runRepository
                .GetByIdAsync(executeScope, runGuid, cancellationToken)
                .ConfigureAwait(false);
        }

        IDisposable governanceScope = runHeader?.PinnedFocusedPilotModeEnabled == true
            ? _runGovernanceScopePinService.BeginRestoredScope(runHeader)
            : PilotModeGovernanceScope.BeginFromPolicyReferences(request.PolicyReferences, request.CloudProvider);

        IReadOnlyList<AgentTask> tasks = await _taskRepository.GetByRunIdAsync(executeScope, runId, cancellationToken);

        if (tasks.Count == 0)
        {
            governanceScope.Dispose();
            throw new NoScheduledAgentTasksException(runId);
        }

        AgentEvidencePackage evidence = await _evidenceBuilder.BuildAsync(runId, request, cancellationToken);
        await _evidencePackageInjectionMitigator.RedactKnownInjectionPatternsAsync(evidence, cancellationToken);
        await _agentEvidenceUntrustedInputSanitizer.SanitizeAsync(evidence, request, cancellationToken);
        string scheduledTaskIds = AgentExecutionStateTransitionTaskIds.Format(tasks.ToList());

        if (ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid executeTransitionRunId))
        {
            _logger.LogInformationAgentExecutionStateTransition(
                executeTransitionRunId, "execute_enter", "agent_batch_executing", scheduledTaskIds);
        }

        return new AgentLoopPreparedBatch
        {
            Run = run, RunId = runId, Actor = actor, Request = request, Tasks = tasks,
            Evidence = evidence, ScheduledTaskIds = scheduledTaskIds, GovernanceScope = governanceScope,
        };
    }
}
