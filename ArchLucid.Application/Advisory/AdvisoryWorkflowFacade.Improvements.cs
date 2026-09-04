using ArchLucid.Contracts.Advisory.Models;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Advisory;

public sealed partial class AdvisoryWorkflowFacade
{
    public async Task<ImprovementsPlanLoadResult> GetImprovementsAsync(
        Guid runId,
        Guid? compareToRunId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        RunDetailDto? run = await _authorityQueryService.GetRunDetailAsync(scope, runId, cancellationToken);
        if (run is null)
            return new ImprovementsPlanLoadResult { Outcome = ImprovementsPlanLoadOutcome.RunNotFound, RunId = runId };
        if (run.GoldenManifest is null)
            return new ImprovementsPlanLoadResult { Outcome = ImprovementsPlanLoadOutcome.ManifestNotFound, RunId = runId };

        await AdvisoryImprovementsPlanSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        FindingsSnapshot findings = run.FindingsSnapshot ?? CreateEmptyFindings(run.GoldenManifest);
        int advisoryFindingCount = findings.Findings?.Count ?? 0;
        ImprovementPlan plan;
        if (compareToRunId.HasValue)
        {
            RunDetailDto? baseRun =
                await _authorityQueryService.GetRunDetailAsync(scope, compareToRunId.Value, cancellationToken);
            if (baseRun is null)
            {
                return new ImprovementsPlanLoadResult
                {
                    Outcome = ImprovementsPlanLoadOutcome.ComparisonRunNotFound,
                    RunId = compareToRunId.Value,
                    AdvisoryFindingCount = advisoryFindingCount,
                };
            }

            if (baseRun.GoldenManifest is null)
            {
                return new ImprovementsPlanLoadResult
                {
                    Outcome = ImprovementsPlanLoadOutcome.ComparisonManifestNotFound,
                    RunId = compareToRunId.Value,
                    AdvisoryFindingCount = advisoryFindingCount,
                };
            }

            await AdvisoryImprovementsPlanSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                compareToRunId.Value,
                scope,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);

            plan = await _improvementAdvisorService.GeneratePlanAsync(
                run.GoldenManifest,
                findings,
                _comparisonService.Compare(baseRun.GoldenManifest, run.GoldenManifest),
                cancellationToken);
        }
        else
        {
            plan = await _improvementAdvisorService.GeneratePlanAsync(run.GoldenManifest, findings, cancellationToken);
        }

        return new ImprovementsPlanLoadResult
        {
            Outcome = ImprovementsPlanLoadOutcome.Success,
            Plan = plan,
            RunId = runId,
            AdvisoryFindingCount = advisoryFindingCount,
        };
    }

    public Task PersistImprovementPlanAsync(ImprovementsPlanLoadResult loadedPlan, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(loadedPlan);
        if (loadedPlan.Plan is null)
            throw new ArgumentException("Loaded plan is required.", nameof(loadedPlan));

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        return _recommendationWorkflowService.PersistPlanAsync(
            loadedPlan.Plan,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            cancellationToken);
    }

    private static FindingsSnapshot CreateEmptyFindings(ManifestDocument manifest) => new()
    {
        SchemaVersion = FindingsSchema.CurrentSnapshotVersion,
        FindingsSnapshotId = manifest.FindingsSnapshotId,
        RunId = manifest.RunId,
        ContextSnapshotId = manifest.ContextSnapshotId,
        GraphSnapshotId = manifest.GraphSnapshotId,
        CreatedUtc = manifest.CreatedUtc,
        Findings = [],
    };
}
