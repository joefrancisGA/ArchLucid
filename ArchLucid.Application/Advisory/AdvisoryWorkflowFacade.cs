using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Advisory.Models;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
using RecommendationActionType = ArchLucid.Contracts.Advisory.Workflow.RecommendationActionType;

namespace ArchLucid.Application.Advisory;

public sealed class AdvisoryWorkflowFacade(
    IAuthorityQueryService authorityQueryService,
    IComparisonService comparisonService,
    IImprovementAdvisorService improvementAdvisorService,
    IScopeContextProvider scopeProvider,
    IRecommendationWorkflowService recommendationWorkflowService,
    IRecommendationRepository recommendationRepository,
    IRunRepository runRepository,
    IRecommendationImproveLoopCoordinator? recommendationImproveLoopCoordinator = null,
    IRecommendationImproveLoopEvidencePersister? recommendationImproveLoopEvidencePersister = null)
    : IAdvisoryWorkflowFacade
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));
    private readonly IComparisonService _comparisonService =
        comparisonService ?? throw new ArgumentNullException(nameof(comparisonService));
    private readonly IImprovementAdvisorService _improvementAdvisorService =
        improvementAdvisorService ?? throw new ArgumentNullException(nameof(improvementAdvisorService));
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));
    private readonly IRecommendationWorkflowService _recommendationWorkflowService =
        recommendationWorkflowService ?? throw new ArgumentNullException(nameof(recommendationWorkflowService));
    private readonly IRecommendationRepository _recommendationRepository =
        recommendationRepository ?? throw new ArgumentNullException(nameof(recommendationRepository));
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IRecommendationImproveLoopCoordinator? _recommendationImproveLoopCoordinator =
        recommendationImproveLoopCoordinator;
    private readonly IRecommendationImproveLoopEvidencePersister? _recommendationImproveLoopEvidencePersister =
        recommendationImproveLoopEvidencePersister;

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

    public async Task<AdvisoryRecommendationsListResult> ListRecommendationsAsync(
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        IReadOnlyList<RecommendationRecord> items = await _recommendationRepository.ListByRunAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            runId,
            cancellationToken);
        Persistence.Models.RunRecord? run =
            await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);
        return new AdvisoryRecommendationsListResult
        {
            Recommendations = items,
            ImproveLoopEvidenceJson = run?.ImproveLoopEvidenceJson,
        };
    }

    public async Task<ApplyRecommendationActionFacadeResult> ApplyRecommendationActionAsync(
        Guid recommendationId,
        string userId,
        string userName,
        RecommendationActionRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        RecommendationRecord? updated = await _recommendationWorkflowService.ApplyActionAsync(
            recommendationId,
            userId,
            userName,
            request,
            cancellationToken);
        if (updated is null)
        {
            return new ApplyRecommendationActionFacadeResult
            {
                Outcome = ApplyRecommendationActionOutcome.NotFound,
                RecommendationId = recommendationId,
            };
        }

        RecommendationImproveLoopResult? improveLoop = null;
        if (_recommendationImproveLoopCoordinator is not null
            && request.Action is RecommendationActionType.Accept or RecommendationActionType.MarkImplemented)
        {
            improveLoop = await _recommendationImproveLoopCoordinator
                .TryApplyAsync(updated, cancellationToken)
                .ConfigureAwait(false);
            if (_recommendationImproveLoopEvidencePersister is not null)
            {
                ScopeContext scope = _scopeProvider.GetCurrentScope();
                await _recommendationImproveLoopEvidencePersister
                    .PersistAsync(scope, updated.RunId, improveLoop, improveLoop?.MergedFindingIds, cancellationToken)
                    .ConfigureAwait(false);
            }
        }

        return new ApplyRecommendationActionFacadeResult
        {
            Outcome = ApplyRecommendationActionOutcome.Success,
            RecommendationId = recommendationId,
            Updated = updated,
            ImproveLoop = improveLoop,
        };
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
