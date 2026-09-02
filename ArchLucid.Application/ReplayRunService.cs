using ArchLucid.Application.Agents;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application;

/// <summary>
///     Replays an existing architecture run by cloning its tasks and evidence, re-executing agents,
///     and optionally committing the result as a new manifest version. Persists the replay run id to
///     <c>dbo.Runs</c> via <see cref = "IRunRepository"/> (no legacy <c>ArchitectureRuns</c> insert).
///     Used by <see cref = "ArchLucid.Application.Determinism.DeterminismCheckService"/> for multi-iteration
///     determinism checks and by comparison services for regenerating stored payloads.
/// </summary>
/// <remarks>
///     When <c>commitReplay</c> is true, cross-agent evaluations and weighted
///     <see cref = "DecisionNode"/> records are produced the same way as the coordinator merge path:
///     <see cref = "IAgentEvaluationService.EvaluateAsync"/> then <see cref = "IDecisionEngineV2.ResolveAsync"/>,
///     then <see cref = "IDecisionEngineService.MergeResults"/>.
/// </remarks>
public sealed partial class ReplayRunService(
    IAgentExecutorResolver agentExecutorResolver,
    IDecisionEngineService decisionEngineService,
    IAgentEvaluationService agentEvaluationService,
    IDecisionEngineV2 decisionEngineV2,
    IArchitectureRequestRepository requestRepository,
    IRunDetailQueryService runDetailQueryService,
    IRunRepository authorityRunRepository,
    IScopeContextProvider scopeContextProvider,
    IAuthorityCommittedManifestChainWriter authorityCommittedManifestChainWriter,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IAgentTaskRepository taskRepository,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    IAuditService auditService,
    IActorContext actorContext,
    IAuthorityRunOrchestrator authorityRunOrchestrator,
    IArchitectureRunCommitOrchestrator architectureRunCommitOrchestrator,
    ICommitRunIdempotencyCoordinator commitRunIdempotencyCoordinator,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    ILogger<ReplayRunService> logger) : IReplayRunService
{
    private readonly IRunDetailQueryService _runDetailQueryService = runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));
    private readonly IAgentExecutorResolver _agentExecutorResolver = agentExecutorResolver ?? throw new ArgumentNullException(nameof(agentExecutorResolver));
    private readonly IDecisionEngineService _decisionEngineService = decisionEngineService ?? throw new ArgumentNullException(nameof(decisionEngineService));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository =
        agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));

    private readonly IAgentTaskRepository _taskRepository =
        taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IRunRepository _authorityRunRepository = authorityRunRepository ?? throw new ArgumentNullException(nameof(authorityRunRepository));
    private readonly IArchitectureRequestRepository _requestRepository = requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));
    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory = unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IAuthorityCommittedManifestChainWriter _authorityCommittedManifestChainWriter =
        authorityCommittedManifestChainWriter ?? throw new ArgumentNullException(nameof(authorityCommittedManifestChainWriter));

    private readonly IAgentEvaluationService
        _agentEvaluationService = agentEvaluationService ?? throw new ArgumentNullException(nameof(agentEvaluationService));

    private readonly IDecisionEngineV2 _decisionEngineV2 = decisionEngineV2 ?? throw new ArgumentNullException(nameof(decisionEngineV2));

    private readonly IAuthorityRunOrchestrator _authorityRunOrchestrator =
        authorityRunOrchestrator ?? throw new ArgumentNullException(nameof(authorityRunOrchestrator));

    private readonly IArchitectureRunCommitOrchestrator _architectureRunCommitOrchestrator =
        architectureRunCommitOrchestrator ?? throw new ArgumentNullException(nameof(architectureRunCommitOrchestrator));

    private readonly ICommitRunIdempotencyCoordinator _commitRunIdempotencyCoordinator =
        commitRunIdempotencyCoordinator ?? throw new ArgumentNullException(nameof(commitRunIdempotencyCoordinator));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly ILogger<ReplayRunService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>
    ///     Creates a new run record seeded from <paramref name = "originalRunId"/>, re-executes agents,
    ///     and (when <paramref name = "commitReplay"/> is <c>true</c>) commits a new manifest.
    /// </summary>
    /// <exception cref = "RunNotFoundException">Thrown when <paramref name = "originalRunId"/> does not exist.</exception>
    /// <exception cref = "InvalidOperationException">
    ///     Thrown when the original run has no tasks, no evidence package, or merge fails.
    /// </exception>
    public async Task<ReplayRunResult> ReplayAsync(string originalRunId, string executionMode = ExecutionModes.Current, bool commitReplay = false,
        string? manifestVersionOverride = null, CancellationToken cancellationToken = default)
    {
        string replayRunId = await PrepareReplayRunAsync(originalRunId, cancellationToken);

        return await ExecutePreparedReplayAsync(
            replayRunId,
            originalRunId,
            executionMode,
            commitReplay,
            manifestVersionOverride,
            cancellationToken);
    }
}
