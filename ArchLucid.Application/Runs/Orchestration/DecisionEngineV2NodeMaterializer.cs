using ArchLucid.Application.Decisions;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <inheritdoc cref="IDecisionEngineV2NodeMaterializer" />
public sealed class DecisionEngineV2NodeMaterializer(
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IArchitectureRequestRepository requestRepository,
    IAgentTaskRepository taskRepository,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IAgentResultRepository agentResultRepository,
    IAgentEvaluationService agentEvaluationService,
    IDecisionEngineV2 decisionEngineV2,
    IDecisionNodeRepository decisionNodeRepository) : IDecisionEngineV2NodeMaterializer
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureRequestRepository _requestRepository =
        requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));

    private readonly IAgentTaskRepository _taskRepository =
        taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository =
        agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IAgentEvaluationService _agentEvaluationService =
        agentEvaluationService ?? throw new ArgumentNullException(nameof(agentEvaluationService));

    private readonly IDecisionEngineV2 _decisionEngineV2 =
        decisionEngineV2 ?? throw new ArgumentNullException(nameof(decisionEngineV2));

    private readonly IDecisionNodeRepository _decisionNodeRepository =
        decisionNodeRepository ?? throw new ArgumentNullException(nameof(decisionNodeRepository));

    /// <inheritdoc />
    public async Task MaterializeIfMissingAsync(string runId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        IReadOnlyList<DecisionNode> existing = DecisionRecordMapper.ToDomain(
            await _decisionNodeRepository.GetByRunIdAsync(runId, cancellationToken));

        if (existing.Count > 0)
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (!Guid.TryParse(runId, out Guid runGuid))
            return;

        RunRecord? run = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (run is null || string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
            return;

        ArchitectureRequest request = await _requestRepository.GetByIdAsync(run.ArchitectureRequestId, cancellationToken)
            ?? throw new InvalidOperationException(
                $"Architecture request '{run.ArchitectureRequestId}' not found for run '{runId}'.");

        IReadOnlyList<AgentTask> tasks = await _taskRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        if (tasks.Count == 0)
            return;

        AgentEvidencePackage? evidence = await _agentEvidencePackageRepository.GetByRunIdAsync(runId, cancellationToken);

        if (evidence is null)
            return;

        IReadOnlyList<AgentResult> results = await _agentResultRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        if (results.Count == 0)
            return;

        IReadOnlyList<AgentEvaluation> evaluations =
            await _agentEvaluationService.EvaluateAsync(runId, request, evidence, tasks, results, cancellationToken);
        IReadOnlyList<DecisionNode> decisionNodes =
            await _decisionEngineV2.ResolveAsync(runId, request, tasks, results, evaluations, cancellationToken);

        if (decisionNodes.Count == 0)
            return;

        await _decisionNodeRepository.CreateManyAsync(
            DecisionRecordMapper.ToRecords(decisionNodes),
            cancellationToken);
    }
}
