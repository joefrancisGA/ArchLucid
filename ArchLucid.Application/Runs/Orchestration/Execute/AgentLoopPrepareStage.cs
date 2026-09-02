using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

public sealed class AgentLoopPrepareStage(
    IArchitectureRequestRepository requestRepository,
    IRequestContentSafetyPrecheck requestContentSafetyPrecheck,
    IScopeContextProvider scopeContextProvider,
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

        IDisposable governanceScope =
            PilotModeGovernanceScope.BeginFromPolicyReferences(request.PolicyReferences, request.CloudProvider);
        ScopeContext executeScope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentTask> tasks = await _taskRepository.GetByRunIdAsync(executeScope, runId, cancellationToken);
        if (tasks.Count == 0)
        {
            governanceScope.Dispose();
            throw new InvalidOperationException($"No tasks found for run '{runId}'.");
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
