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
public sealed class RunDetailQueryService(
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentTaskRepository taskRepository,
    IAgentResultRepository resultRepository,
    IUnifiedGoldenManifestReader unifiedGoldenManifestReader,
    IDecisionTraceRepository authorityDecisionTraceRepository,
    IFindingRecordMuteRepository findingRecordMuteRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    ILlmCostEstimator llmCostEstimator,
    ILogger<RunDetailQueryService> logger) : IRunDetailQueryService
{
    private readonly IAgentResultRepository _resultRepository = resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));

    private readonly IDecisionTraceRepository _authorityDecisionTraceRepository =
        authorityDecisionTraceRepository ?? throw new ArgumentNullException(nameof(authorityDecisionTraceRepository));

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly ILlmCostEstimator _llmCostEstimator =
        llmCostEstimator ?? throw new ArgumentNullException(nameof(llmCostEstimator));

    private readonly IFindingRecordMuteRepository _findingRecordMuteRepository =
        findingRecordMuteRepository ?? throw new ArgumentNullException(nameof(findingRecordMuteRepository));

    private readonly ILogger<RunDetailQueryService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IAgentTaskRepository _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IUnifiedGoldenManifestReader _unifiedGoldenManifestReader =
        unifiedGoldenManifestReader ?? throw new ArgumentNullException(nameof(unifiedGoldenManifestReader));

    /// <inheritdoc/>
    public async Task<ArchitectureRunDetail?> GetRunDetailAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        if (!TryParseRunGuid(runId, out Guid runGuid))
        {
            if (logger.IsEnabled(LogLevel.Debug))
                logger.LogDebug("RunDetailQueryService: run '{RunId}' is not a valid run identifier.", LogSanitizer.Sanitize(runId));
            return null;
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? record = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);
        if (record is null)
        {
            if (logger.IsEnabled(LogLevel.Debug))
                logger.LogDebug("RunDetailQueryService: run '{RunId}' not found.", LogSanitizer.Sanitize(runId));
            return null;
        }

        IReadOnlyList<AgentTask> tasks = await taskRepository.GetByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);
        ArchitectureRun run = RunRecordToArchitectureRunMapper.ToArchitectureRun(record, tasks.Select(t => t.TaskId).ToList());
        List<AgentResult> results = (await resultRepository.GetByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false)).ToList();

        if (record.FindingsSnapshotId is { } findingsSnapshotId)
        {
            IReadOnlyDictionary<string, FindingMuteFlag> flags =
                await findingRecordMuteRepository.GetMuteFlagsAsync(findingsSnapshotId, scope, cancellationToken).ConfigureAwait(false);

            FindingMuteFlagApplier.Apply(results, flags);
        }

        GoldenManifest? manifest = await unifiedGoldenManifestReader.ReadByRunIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);
        List<DecisionTraceDto> decisionTraces = [];
        if (manifest is null)
        {
            if (!string.IsNullOrWhiteSpace(run.CurrentManifestVersion) && logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning("RunDetailQueryService: run '{RunId}' references manifest version '{Version}' which no longer exists.",
                    LogSanitizer.Sanitize(runId), LogSanitizer.Sanitize(run.CurrentManifestVersion));
        }
        else if (record.DecisionTraceId is { } authorityTraceId)
        {
            DecisionTraceDto? authorityTrace = await authorityDecisionTraceRepository.GetByIdAsync(scope, authorityTraceId, cancellationToken).ConfigureAwait(false);
            if (authorityTrace is not null)
                decisionTraces = [authorityTrace];
        }

        IReadOnlyList<AgentExecutionTraceLlmCostSlice> costSlices = await _agentExecutionTraceRepository
            .GetLlmCostSlicesByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);
        ArchLucid.Contracts.Runs.RunAgentLlmCostEstimateDto? costEstimate = null;

        if (costSlices.Count > 0)
        {
            AgentExecutionTraceRunLlmCostSummary costSummary =
                AgentExecutionTraceRunLlmCostAggregator.Compute(costSlices, _llmCostEstimator);
            costEstimate = new ArchLucid.Contracts.Runs.RunAgentLlmCostEstimateDto
            {
                EstimatedCostUsd = costSummary.EstimatedCostUsd,
                TokenCounts = new ArchLucid.Contracts.Runs.RunLlmTokenCountsDto
                {
                    Prompt = costSummary.PromptTokens,
                    Completion = costSummary.CompletionTokens
                },
                Model = costSummary.ModelLabel,
                CostEstimationBasis = costSummary.CostEstimationBasis
            };
        }

        return new ArchitectureRunDetail
        {
            Run = run,
            Tasks = tasks.ToList(),
            Results = results,
            Manifest = manifest,
            DecisionTraces = decisionTraces,
            AgentExecutionLlmCostEstimate = costEstimate,
            HasBrokenManifestReference = !string.IsNullOrWhiteSpace(run.CurrentManifestVersion) && manifest is null
        };
    }

    /// <inheritdoc/>
    public async Task<IReadOnlyList<RunSummary>> ListRunSummariesAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        IReadOnlyList<RunRecord> records = await runRepository.ListRecentInScopeAsync(scope, 200, cancellationToken).ConfigureAwait(false);
        return records.Select(r => new RunSummary
        {
            RunId = r.RunId.ToString("N"),
            RequestId = r.ArchitectureRequestId ?? string.Empty,
            Status = r.LegacyRunStatus ?? nameof(ArchitectureRunStatus.Created),
            CreatedUtc = r.CreatedUtc,
            CompletedUtc = r.CompletedUtc,
            CurrentManifestVersion = r.CurrentManifestVersion,
            SystemName = r.ProjectId,
            IsDeadLettered = RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(r),
            PackageOrigin = r.PackageOrigin
        }).ToList();
    }

    /// <inheritdoc/>
    public async Task<(IReadOnlyList<RunSummary> Items, bool HasMore, string? NextCursor)> ListRunSummariesKeysetAsync(string? cursor, int take,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        DateTime? cursorUtc = null;
        Guid? cursorRunId = null;
        (DateTime CreatedUtc, Guid RunId)? decoded = RunCursorCodec.TryDecode(cursor);
        if (decoded.HasValue)
        {
            cursorUtc = decoded.Value.CreatedUtc;
            cursorRunId = decoded.Value.RunId;
        }

        RunListPage page = await runRepository.ListRecentInScopeKeysetAsync(scope, cursorUtc, cursorRunId, take, cancellationToken).ConfigureAwait(false);
        IReadOnlyList<RunSummary> items = page.Items.Select(r => new RunSummary
        {
            RunId = r.RunId.ToString("N"),
            RequestId = r.ArchitectureRequestId ?? string.Empty,
            Status = r.LegacyRunStatus ?? nameof(ArchitectureRunStatus.Created),
            CreatedUtc = r.CreatedUtc,
            CompletedUtc = r.CompletedUtc,
            CurrentManifestVersion = r.CurrentManifestVersion,
            SystemName = r.ProjectId,
            IsDeadLettered = RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(r),
            PackageOrigin = r.PackageOrigin
        }).ToList();
        string? next = null;
        if (!page.HasMore || page.Items.Count <= 0)
            return (items, page.HasMore, next);
        RunRecord last = page.Items[^1];
        next = RunCursorCodec.Encode(last.CreatedUtc, last.RunId);
        return (items, page.HasMore, next);
    }

    /// <inheritdoc/>
    public async Task<(IReadOnlyList<RunSummary> Items, bool HasMore)> ListRunSummariesOffsetAsync(
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunListPage page = await runRepository.ListRecentInScopeOffsetAsync(
            scope,
            RunPagination.NormalizeOffset(offset),
            RunPagination.ClampLimit(limit),
            cancellationToken).ConfigureAwait(false);
        IReadOnlyList<RunSummary> items = page.Items.Select(r => new RunSummary
        {
            RunId = r.RunId.ToString("N"),
            RequestId = r.ArchitectureRequestId ?? string.Empty,
            Status = r.LegacyRunStatus ?? nameof(ArchitectureRunStatus.Created),
            CreatedUtc = r.CreatedUtc,
            CompletedUtc = r.CompletedUtc,
            CurrentManifestVersion = r.CurrentManifestVersion,
            SystemName = r.ProjectId,
            IsDeadLettered = RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(r),
            PackageOrigin = r.PackageOrigin
        }).ToList();

        return (items, page.HasMore);
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
