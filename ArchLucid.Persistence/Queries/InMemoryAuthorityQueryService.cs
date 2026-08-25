using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Queries;

/// <summary>
///     <see cref="IAuthorityQueryService" /> backed by the same repository abstractions as
///     <see cref="DapperAuthorityQueryService" /> (in-memory stores in test / storage-off mode).
/// </summary>
public sealed class InMemoryAuthorityQueryService(
    IRunRepository runRepository,
    IContextSnapshotRepository contextSnapshotRepository,
    IGraphSnapshotRepository graphSnapshotRepository,
    IGraphSnapshotProjectionCache graphSnapshotProjectionCache,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IDecisionTraceRepository decisionTraceRepository,
    IGoldenManifestRepository goldenManifestRepository,
    IArtifactBundleRepository artifactBundleRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IRiskExceptionRepository riskExceptionRepository)
    : IAuthorityQueryService
{
    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    private readonly IRiskExceptionRepository _riskExceptionRepository =
        riskExceptionRepository ?? throw new ArgumentNullException(nameof(riskExceptionRepository));

    /// <inheritdoc />
    public async Task<IReadOnlyList<RunSummaryDto>> ListRunsByProjectAsync(
        ScopeContext scope,
        string projectId,
        int take,
        CancellationToken ct)
    {
        IReadOnlyList<RunRecord> runs = await runRepository.ListByProjectAsync(scope, projectId, take, ct);
        List<RunSummaryDto> summaries = runs.Select(AuthorityRunMapper.MapSummary).ToList();
        await RunExecutionDegradation.PopulateSummariesAsync(scope, summaries, runs, _agentExecutionTraceRepository, ct);

        return summaries;
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<RunSummaryDto> Items, bool HasMore)> ListRunsByProjectKeysetAsync(
        ScopeContext scope,
        string projectId,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take,
        CancellationToken ct)
    {
        RunListPage page =
            await runRepository.ListByProjectKeysetAsync(scope, projectId, cursorCreatedUtc, cursorRunId, take, ct);

        List<RunSummaryDto> summaries = page.Items.Select(AuthorityRunMapper.MapSummary).ToList();
        await RunExecutionDegradation.PopulateSummariesAsync(scope, summaries, page.Items, _agentExecutionTraceRepository, ct);

        return (summaries, page.HasMore);
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<RunSummaryDto> Items, bool HasMore)> ListRunsInScopeKeysetAsync(
        ScopeContext scope,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take,
        CancellationToken ct)
    {
        RunListPage page =
            await runRepository.ListRecentInScopeKeysetAsync(scope, cursorCreatedUtc, cursorRunId, take, ct);

        List<RunSummaryDto> summaries = page.Items.Select(AuthorityRunMapper.MapSummary).ToList();
        await RunExecutionDegradation.PopulateSummariesAsync(scope, summaries, page.Items, _agentExecutionTraceRepository, ct);

        return (summaries, page.HasMore);
    }

    /// <inheritdoc />
    public Task<Guid?> GetLatestCommittedRunIdByManifestCreatedUtcAsync(
        ScopeContext scope,
        string projectId,
        CancellationToken ct)
        => runRepository.GetLatestCommittedRunIdByManifestCreatedUtcAsync(scope, projectId, ct);

    /// <inheritdoc />
    public async Task<RunSummaryDto?> GetPriorCommittedRunSummaryBeforeCurrentAsync(
        ScopeContext scope,
        Guid currentRunId,
        string projectId,
        DateTime currentCreatedUtc,
        CancellationToken ct)
    {
        RunRecord? currentRun = await runRepository.GetByIdAsync(scope, currentRunId, ct).ConfigureAwait(false);

        if (currentRun?.ArchitectureId is Guid architectureId)
        {
            Guid? architecturePriorRunId = await runRepository
                .GetPriorCommittedRunIdForArchitectureBeforeCurrentAsync(
                    scope,
                    architectureId,
                    currentRunId,
                    currentCreatedUtc,
                    ct)
                .ConfigureAwait(false);

            if (architecturePriorRunId is not null)
                return await GetRunSummaryAsync(scope, architecturePriorRunId.Value, ct).ConfigureAwait(false);
        }

        Guid? priorRunId = await runRepository.GetPriorCommittedRunIdBeforeCurrentAsync(
            scope,
            projectId,
            currentRunId,
            currentCreatedUtc,
            ct);

        if (priorRunId is null)
            return null;

        return await GetRunSummaryAsync(scope, priorRunId.Value, ct);
    }

    public async Task<RunSummaryDto?> GetRunSummaryAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, ct);

        if (run is null)
            return null;

        RunSummaryDto summary = AuthorityRunMapper.MapSummary(run);
        IReadOnlyList<string> agents = await _agentExecutionTraceRepository.GetDistinctAgentTypesWithLlmResourceFallbackAsync(
            scope,
            run.RunId.ToString("N"),
            ct);
        RunExecutionDegradation.Apply(summary, run, agents);

        return summary;
    }

    /// <inheritdoc />
    public async Task<RunDetailDto?> GetRunDetailAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken ct,
        bool loadArtifactBodies = false)
    {
        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, ct);
        if (run is null)
            return null;

        Task<ContextSnapshot?> contextTask = run.ContextSnapshotId.HasValue
            ? contextSnapshotRepository.GetByIdAsync(scope.ToReadScope(), run.ContextSnapshotId.Value, ct)
            : Task.FromResult<ContextSnapshot?>(null);
        Task<GraphSnapshot?> graphTask = run.GraphSnapshotId.HasValue
            ? graphSnapshotProjectionCache.GetOrLoadAsync(
                scope,
                run.RunId,
                run.GraphSnapshotId.Value,
                token => graphSnapshotRepository.GetByIdAsync(scope, run.GraphSnapshotId!.Value, token),
                ct)
            : Task.FromResult<GraphSnapshot?>(null);
        Task<FindingsSnapshot?> findingsTask = run.FindingsSnapshotId.HasValue
            ? findingsSnapshotRepository.GetByIdAsync(scope, run.FindingsSnapshotId.Value, ct)
            : Task.FromResult<FindingsSnapshot?>(null);
        Task<DecisionTraceDto?> traceTask = run.DecisionTraceId.HasValue
            ? decisionTraceRepository.GetByIdAsync(scope, run.DecisionTraceId.Value, ct)
            : Task.FromResult<DecisionTraceDto?>(null);
        Task<ManifestDocument?> manifestTask = run.GoldenManifestId.HasValue
            ? goldenManifestRepository.GetByIdAsync(scope, run.GoldenManifestId.Value, ct)
            : Task.FromResult<ManifestDocument?>(null);
        Task<ArtifactBundle?> bundleTask = run.GoldenManifestId.HasValue
            ? artifactBundleRepository.GetByManifestIdAsync(scope, run.GoldenManifestId.Value, loadArtifactBodies, ct)
            : Task.FromResult<ArtifactBundle?>(null);
        Task<IReadOnlyList<string>> degradedAgentsTask =
            _agentExecutionTraceRepository.GetDistinctAgentTypesWithLlmResourceFallbackAsync(scope, run.RunId.ToString("N"), ct);

        await Task.WhenAll(
            contextTask,
            graphTask,
            findingsTask,
            traceTask,
            manifestTask,
            bundleTask,
            degradedAgentsTask);

        RunDetailDto detail = new()
        {
            Run = run,
            ContextSnapshot = await contextTask,
            GraphSnapshot = await graphTask,
            FindingsSnapshot = await findingsTask,
            AuthorityTrace = await traceTask,
            GoldenManifest = await manifestTask,
            ArtifactBundle = await bundleTask
        };

        RunExecutionDegradation.Apply(detail, run, await degradedAgentsTask);
        RunFindingCoverageProjection.Apply(detail, detail.FindingsSnapshot);

        if (detail.FindingsSnapshot is not null)
        {
            DateTimeOffset since = TimeProvider.System.UtcNowDateTime().AddYears(-2);
            IReadOnlyList<FindingReviewEventRecord> trailEvents =
                await _findingReviewTrailRepository.ListSinceUtcAsync(scope.TenantId, since, ct);
            IReadOnlyList<RiskExceptionRecord> activeWaivers =
                await _riskExceptionRepository.ListActiveForTenantAsync(scope.TenantId, scope.ProjectId, ct);
            RunFindingDispositionCoverage? dispositionCoverage = RunFindingDispositionCoverageBuilder.Build(
                detail.FindingsSnapshot,
                trailEvents,
                activeWaivers);

            RunFindingCoverageProjection.ApplyDispositionCoverage(detail, dispositionCoverage);
        }

        return detail;
    }

    /// <inheritdoc />
    public async Task<RunDetailDto?> GetRunDetailForExportAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, ct);

        return await AuthorityRunDetailInternalLoader.LoadForExportAsync(
            run,
            decisionTraceRepository,
            goldenManifestRepository,
            scope,
            ct);
    }

    /// <inheritdoc />
    public async Task<RunDetailDto?> GetRunDetailForManifestCompareAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, ct);

        return await AuthorityRunDetailInternalLoader.LoadForManifestCompareAsync(
            run,
            goldenManifestRepository,
            scope,
            ct);
    }

    /// <inheritdoc />
    public async Task<RunDetailDto?> GetRunDetailForRetrievalIndexingAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, ct);

        if (run is null)
            return null;

        Task<GraphSnapshot?> graphTask = run.GraphSnapshotId.HasValue
            ? graphSnapshotProjectionCache.GetOrLoadAsync(
                scope,
                run.RunId,
                run.GraphSnapshotId.Value,
                token => graphSnapshotRepository.GetByIdAsync(scope, run.GraphSnapshotId!.Value, token),
                ct)
            : Task.FromResult<GraphSnapshot?>(null);
        Task<FindingsSnapshot?> findingsTask = run.FindingsSnapshotId.HasValue
            ? findingsSnapshotRepository.GetByIdAsync(scope, run.FindingsSnapshotId.Value, ct)
            : Task.FromResult<FindingsSnapshot?>(null);
        Task<DecisionTraceDto?> traceTask = run.DecisionTraceId.HasValue
            ? decisionTraceRepository.GetByIdAsync(scope, run.DecisionTraceId.Value, ct)
            : Task.FromResult<DecisionTraceDto?>(null);
        Task<ManifestDocument?> manifestTask = run.GoldenManifestId.HasValue
            ? goldenManifestRepository.GetByIdAsync(scope, run.GoldenManifestId.Value, ct)
            : Task.FromResult<ManifestDocument?>(null);
        Task<ArtifactBundle?> bundleTask = run.GoldenManifestId.HasValue
            ? artifactBundleRepository.GetByManifestIdAsync(scope, run.GoldenManifestId.Value, loadArtifactBodies: false, ct)
            : Task.FromResult<ArtifactBundle?>(null);

        await Task.WhenAll(graphTask, findingsTask, traceTask, manifestTask, bundleTask);

        return new RunDetailDto
        {
            Run = run,
            GraphSnapshot = await graphTask,
            FindingsSnapshot = await findingsTask,
            AuthorityTrace = await traceTask,
            GoldenManifest = await manifestTask,
            ArtifactBundle = await bundleTask,
        };
    }

    /// <inheritdoc />
    public async Task<RunDetailDto?> GetRunDetailForBuyerSummaryAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, ct);

        if (run is null)
            return null;

        Task<FindingsSnapshot?> findingsTask = BuyerSummaryOptionalLoad.SoftAsync(
            token => run.FindingsSnapshotId.HasValue
                ? findingsSnapshotRepository.GetCoverageProjectionByIdAsync(scope, run.FindingsSnapshotId.Value, token)
                : Task.FromResult<FindingsSnapshot?>(null),
            ct);
        Task<DecisionTraceDto?> traceTask = BuyerSummaryOptionalLoad.SoftAsync(
            token => run.DecisionTraceId.HasValue
                ? decisionTraceRepository.GetByIdAsync(scope, run.DecisionTraceId.Value, token)
                : Task.FromResult<DecisionTraceDto?>(null),
            ct);
        Task<ManifestDocument?> manifestTask = BuyerSummaryOptionalLoad.SoftAsync(
            token => run.GoldenManifestId.HasValue
                ? goldenManifestRepository.GetByIdAsync(scope, run.GoldenManifestId.Value, token)
                : Task.FromResult<ManifestDocument?>(null),
            ct);
        Task<IReadOnlyList<string>> degradedAgentsTask = BuyerSummaryOptionalLoad.SoftListAsync(
            token => _agentExecutionTraceRepository.GetDistinctAgentTypesWithLlmResourceFallbackAsync(
                scope,
                run.RunId.ToString("N"),
                token),
            ct);

        await Task.WhenAll(findingsTask, traceTask, manifestTask, degradedAgentsTask);

        RunDetailDto detail = new()
        {
            Run = run,
            FindingsSnapshot = await findingsTask,
            AuthorityTrace = await traceTask,
            GoldenManifest = await manifestTask,
        };

        RunExecutionDegradation.Apply(detail, run, await degradedAgentsTask);
        RunFindingCoverageProjection.Apply(detail, detail.FindingsSnapshot);

        if (detail.FindingsSnapshot is not null)
        {
            try
            {
                DateTimeOffset since = TimeProvider.System.UtcNowDateTime().AddYears(-2);
                IReadOnlyList<FindingReviewEventRecord> trailEvents =
                    await _findingReviewTrailRepository.ListSinceUtcAsync(scope.TenantId, since, ct);
                IReadOnlyList<RiskExceptionRecord> activeWaivers =
                    await _riskExceptionRepository.ListActiveForTenantAsync(scope.TenantId, scope.ProjectId, ct);
                RunFindingDispositionCoverage? dispositionCoverage = RunFindingDispositionCoverageBuilder.Build(
                    detail.FindingsSnapshot,
                    trailEvents,
                    activeWaivers);

                RunFindingCoverageProjection.ApplyDispositionCoverage(detail, dispositionCoverage);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception)
            {
                // Disposition counts are optional for buyer SSR.
            }
        }

        return detail;
    }

    /// <inheritdoc />
    public async Task<ManifestSummaryDto?> GetManifestSummaryAsync(ScopeContext scope, Guid manifestId,
        CancellationToken ct)
    {
        ManifestDocument? manifest = await goldenManifestRepository.GetByIdAsync(scope, manifestId, ct);
        return manifest is null ? null : AuthorityRunMapper.MapManifestSummary(manifest);
    }
}

