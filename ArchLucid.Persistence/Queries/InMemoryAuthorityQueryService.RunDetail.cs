using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Queries;

public sealed partial class InMemoryAuthorityQueryService
{
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
}
