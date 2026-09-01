using ArchLucid.Application.Findings;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Mapping;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Application.Agents;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application;

/// <summary>
///     Assembles the canonical <see cref = "ArchitectureRunDetail"/> from individual repositories.
///     This is the single, authoritative query path for run state — controllers, API application
///     services, analysis/export/compare, governance, and <see cref = "ReplayRunService"/> should use this
///     instead of assembling run metadata, tasks, results, manifest, and traces from repositories separately.
/// </summary>
/// <remarks>
///     ADR 0030 PR A3 (2026-04-24): the legacy <c>ICoordinatorDecisionTraceRepository</c> read path was
///     removed along with the interface itself. Decision traces are now read from
///     <see cref = "IDecisionTraceRepository">Decisioning.Interfaces.IDecisionTraceRepository</see> via
///     <see cref = "Persistence.Models.RunRecord.DecisionTraceId"/> on the run header — the authority FK
///     chain populates that pointer at commit time (<see cref = "ReplayRunService"/> + demo seed both go
///     through <c>IAuthorityCommittedManifestChainWriter.PersistCommittedChainAsync</c>).
/// </remarks>
public sealed partial class RunDetailQueryService(
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentTaskRepository taskRepository,
    IAgentResultRepository resultRepository,
    IUnifiedGoldenManifestReader unifiedGoldenManifestReader,
    IDecisionTraceRepository authorityDecisionTraceRepository,
    IFindingRecordMuteRepository findingRecordMuteRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    ILlmCostEstimator llmCostEstimator,
    IFindingTrustLabelMapper findingTrustLabelMapper,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    IRunStateTransitionService runStateTransitionService,
    ILogger<RunDetailQueryService> logger) : IRunDetailQueryService
{
    private readonly IAgentResultRepository _resultRepository = resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));

    private readonly IDecisionTraceRepository _authorityDecisionTraceRepository =
        authorityDecisionTraceRepository ?? throw new ArgumentNullException(nameof(authorityDecisionTraceRepository));

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly ILlmCostEstimator _llmCostEstimator =
        llmCostEstimator ?? throw new ArgumentNullException(nameof(llmCostEstimator));

    private readonly IFindingTrustLabelMapper _findingTrustLabelMapper =
        findingTrustLabelMapper ?? throw new ArgumentNullException(nameof(findingTrustLabelMapper));

    private readonly IFindingRecordMuteRepository _findingRecordMuteRepository =
        findingRecordMuteRepository ?? throw new ArgumentNullException(nameof(findingRecordMuteRepository));

    private readonly ILogger<RunDetailQueryService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IAgentTaskRepository _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IUnifiedGoldenManifestReader _unifiedGoldenManifestReader =
        unifiedGoldenManifestReader ?? throw new ArgumentNullException(nameof(unifiedGoldenManifestReader));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    /// <inheritdoc/>
    public Task<ArchitectureRunDetail?> GetRunDetailAsync(string runId, CancellationToken cancellationToken = default) =>
        LoadRunDetailAsync(runId, useRollupProjection: false, cancellationToken);

    /// <inheritdoc/>
    public Task<ArchitectureRunDetail?> GetRunDetailForOperatorEnrichAsync(
        string runId,
        CancellationToken cancellationToken = default) =>
        LoadRunDetailAsync(runId, useRollupProjection: true, cancellationToken);
}
