using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Persistence.Alerts.Simulation;

/// <summary>
/// Replays advisory-style plan generation for historical runs to produce <see cref="AlertEvaluationContext"/> for simulation APIs or tooling.
/// </summary>
/// <param name="authorityQueryService">Loads run detail and golden manifests.</param>
/// <param name="improvementAdvisorService">Builds <see cref="ImprovementPlan"/> from manifest and findings.</param>
/// <param name="comparisonService">Optional baseline-vs-latest comparison.</param>
/// <param name="recommendationRepository">Recommendations per run.</param>
/// <param name="recommendationLearningService">Learning profile for the scope.</param>
/// <remarks>
/// Does not set <see cref="AlertEvaluationContext.EffectiveGovernanceContent"/>; downstream evaluation loads merged policy when needed.
/// </remarks>
public sealed class AlertSimulationContextProvider(
    IAuthorityQueryService authorityQueryService,
    IImprovementAdvisorService improvementAdvisorService,
    IComparisonService comparisonService,
    IRecommendationRepository recommendationRepository,
    IRecommendationLearningService recommendationLearningService,
    IManifestHashService manifestHashService) : IAlertSimulationContextProvider
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<AlertEvaluationContext>> GetContextsAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid? runId,
        Guid? comparedToRunId,
        int recentRunCount,
        string runProjectSlug,
        CancellationToken ct)
    {
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        List<AlertEvaluationContext> results = [];

        if (runId.HasValue)
        {
            AlertEvaluationContext? single = await BuildContextAsync(
                    scope,
                    runId.Value,
                    comparedToRunId,
                    skipOnSealedHashFailure: false,
                    ct)
                ;

            if (single is not null)
                results.Add(single);

            return results;
        }

        int take = Math.Clamp(recentRunCount, 1, 50);
        IReadOnlyList<RunSummaryDto> runs = await authorityQueryService
            .ListRunsByProjectAsync(scope, string.IsNullOrWhiteSpace(runProjectSlug) ? "default" : runProjectSlug.Trim(), take, ct)
            ;

        foreach (RunSummaryDto run in runs.OrderByDescending(x => x.CreatedUtc))
        {
            AlertEvaluationContext? context = await BuildContextAsync(
                scope,
                run.RunId,
                comparedToRunId: null,
                skipOnSealedHashFailure: true,
                ct);

            if (context is not null)
                results.Add(context);
        }

        return results;
    }

    /// <summary>
    /// Loads run detail, builds plan (with optional comparison), attaches recommendations and learning profile.
    /// </summary>
    /// <returns><c>null</c> when the run has no golden manifest or is outside the caller scope.</returns>
    private async Task<AlertEvaluationContext?> BuildContextAsync(
        ScopeContext scope,
        Guid runId,
        Guid? comparedToRunId,
        bool skipOnSealedHashFailure,
        CancellationToken ct)
    {
        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);
        if (detail?.GoldenManifest is null)
            return null;

        // Defense in depth: never build simulation contexts from a run that does not match the caller scope,
        // even if the query layer returned a row (mis-scoped catalog / IDOR residual).
        if (!RunMatchesCallerScope(detail.Run, scope))
            return null;

        if (detail.GoldenManifest.RunId != runId)
            return null;

        if (skipOnSealedHashFailure)
        {
            if (!AlertSimulationSealedManifestHashGuard.TryEnsureRunSealedManifestHash(
                    detail.GoldenManifest,
                    runId,
                    manifestHashService))
            {
                return null;
            }
        }
        else
        {
            AlertSimulationSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrow(
                detail.GoldenManifest,
                runId,
                manifestHashService);
        }

        FindingsSnapshot findings = detail.FindingsSnapshot ?? CreateEmptyFindings(detail.GoldenManifest);

        if (!FindingsSnapshotMatchesGoldenManifest(findings, detail.GoldenManifest))
            return null;

        ComparisonResult? comparison = null;

        if (comparedToRunId.HasValue)
        {
            RunDetailDto? comparedDetail = await authorityQueryService
                .GetRunDetailAsync(scope, comparedToRunId.Value, ct)
                ;

            if (comparedDetail?.GoldenManifest is not null
                && RunMatchesCallerScope(comparedDetail.Run, scope)
                && comparedDetail.GoldenManifest.RunId == comparedToRunId.Value)
            {
                if (skipOnSealedHashFailure)
                {
                    if (!AlertSimulationSealedManifestHashGuard.TryEnsureRunSealedManifestHash(
                            comparedDetail.GoldenManifest,
                            comparedToRunId.Value,
                            manifestHashService))
                    {
                        comparedDetail = null;
                    }
                }
                else
                {
                    AlertSimulationSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrow(
                        comparedDetail.GoldenManifest,
                        comparedToRunId.Value,
                        manifestHashService);
                }

                if (comparedDetail?.GoldenManifest is not null)
                    comparison = comparisonService.Compare(comparedDetail.GoldenManifest, detail.GoldenManifest);
            }
        }

        ImprovementPlan plan = comparison is null
            ? await improvementAdvisorService
                .GeneratePlanAsync(detail.GoldenManifest, findings, ct)

            : await improvementAdvisorService
                .GeneratePlanAsync(detail.GoldenManifest, findings, comparison, ct)
                ;

        IReadOnlyList<RecommendationRecord> recommendations = await recommendationRepository
            .ListByRunAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, runId, ct)
            ;

        RecommendationLearningProfile? learning = await recommendationLearningService
            .GetLatestProfileAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, ct)
            ;

        return new AlertEvaluationContext
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runId,
            ComparedToRunId = comparison is null ? null : comparedToRunId,
            ImprovementPlan = plan,
            ComparisonResult = comparison,
            RecommendationRecords = recommendations,
            LearningProfile = learning,
        };
    }

    private static bool RunMatchesCallerScope(RunRecord run, ScopeContext scope) =>
        run.TenantId == scope.TenantId
        && run.WorkspaceId == scope.WorkspaceId
        && run.ScopeProjectId == scope.ProjectId;

    private static bool FindingsSnapshotMatchesGoldenManifest(FindingsSnapshot findings, ManifestDocument manifest) =>
        findings.RunId == manifest.RunId
        && findings.FindingsSnapshotId == manifest.FindingsSnapshotId
        && findings.ContextSnapshotId == manifest.ContextSnapshotId
        && findings.GraphSnapshotId == manifest.GraphSnapshotId;

    private static FindingsSnapshot CreateEmptyFindings(ManifestDocument manifest) =>
        new()
        {
            SchemaVersion = FindingsSchema.CurrentSnapshotVersion,
            FindingsSnapshotId = manifest.FindingsSnapshotId,
            RunId = manifest.RunId,
            ContextSnapshotId = manifest.ContextSnapshotId,
            GraphSnapshotId = manifest.GraphSnapshotId,
            CreatedUtc = manifest.CreatedUtc,
            Findings = []
        };

}
