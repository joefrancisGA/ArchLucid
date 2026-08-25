using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Post-stage side effects for closed-loop architecture reasoning (re-review integration and product publish).
/// </summary>
public sealed class ClosedLoopArchitectureReasoningPostStageHooks(
    ISpecialistFindingsSubstantiationService substantiationService,
    IArchitectureIntelligenceProductPublishService productPublishService,
    IScopeContextProvider? scopeContextProvider = null,
    IAuthorityFindingsSnapshotUpdater? authorityFindingsSnapshotUpdater = null)
{
    private readonly ISpecialistFindingsSubstantiationService _substantiationService =
        substantiationService ?? throw new ArgumentNullException(nameof(substantiationService));

    private readonly IArchitectureIntelligenceProductPublishService _productPublishService =
        productPublishService ?? throw new ArgumentNullException(nameof(productPublishService));

    private readonly IScopeContextProvider? _scopeContextProvider = scopeContextProvider;

    private readonly IAuthorityFindingsSnapshotUpdater? _authorityFindingsSnapshotUpdater =
        authorityFindingsSnapshotUpdater;

    public async Task IntegrateReReviewFindingsAsync(
        string runId,
        IncrementalReReviewResult reReview,
        List<SpecialistReviewFinding> allFindings,
        List<EvidenceValidationResult> validationResults,
        Dictionary<string, EvidenceValidationResult> validationByFindingId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(reReview);
        ArgumentNullException.ThrowIfNull(allFindings);
        ArgumentNullException.ThrowIfNull(validationResults);
        ArgumentNullException.ThrowIfNull(validationByFindingId);

        SpecialistFindingsSubstantiationResult? substantiation = await ClosedLoopReReviewPublishIntegrator
            .IntegrateAsync(
                reReview,
                allFindings,
                validationResults,
                validationByFindingId,
                _substantiationService,
                cancellationToken)
            .ConfigureAwait(false);

        if (substantiation is null
            || _authorityFindingsSnapshotUpdater is null
            || _scopeContextProvider is null
            || !Guid.TryParse(runId, out Guid parsedRunId))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<string> mergedFindingIds = await _authorityFindingsSnapshotUpdater
            .MergeSubstantiatedFindingsAsync(scope, parsedRunId, substantiation, cancellationToken)
            .ConfigureAwait(false);

        reReview.MergedFindingIds = mergedFindingIds;
    }

    public async Task ApplyProductPublishAsync(
        ClosedLoopReasoningRequest request,
        ClosedLoopReasoningResult result,
        string tenantId,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(result);
        ArgumentNullException.ThrowIfNull(tenantId);
        ArgumentNullException.ThrowIfNull(runId);

        string workspaceId = request.WorkspaceId ?? tenantId;
        string projectId = request.ProjectId ?? tenantId;

        ArchitectureIntelligencePublishResult publishResult = await _productPublishService.PublishAsync(
            result,
            tenantId,
            workspaceId,
            projectId,
            runId,
            cancellationToken);

        result.PublishedToProduct = publishResult.Published;
        result.PublishedFindingsSnapshotId = publishResult.FindingsSnapshotId;
        result.PublishedRecommendationCount = publishResult.RecommendationCount;
        result.PublishSkipReason = publishResult.SkipReason;
    }
}
