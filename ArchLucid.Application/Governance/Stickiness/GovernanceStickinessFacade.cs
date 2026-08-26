using ArchLucid.Application.Common;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Governance.Stickiness;

/// <summary>
///     Default <see cref="IGovernanceStickinessFacade"/> consolidating stickiness route orchestration previously in
///     <c>GovernanceStickinessController</c>.
/// </summary>
public sealed partial class GovernanceStickinessFacade(
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IFindingDispositionService findingDispositionService,
    IRiskExceptionService riskExceptionService,
    IArchitectureRiskRegisterService riskRegisterService,
    IArchitectureDecisionRegisterService decisionRegisterService,
    IArchitectureReviewRecurrenceScheduleRepository recurrenceScheduleRepository,
    IArchitectureReviewRecurrenceNextRunCalculator recurrenceNextRunCalculator,
    IRunRepository runRepository,
    IFindingMergeConflictResolutionService findingMergeConflictResolutionService,
    IGovernanceDigestDecisionNeededComposer governanceDigestDecisionNeededComposer,
    IReviewsAwaitingActionQueryService reviewsAwaitingActionQueryService,
    IRealizedValueAttestationService attestationService,
    IAuditService auditService,
    IFindingInspectReadRepository findingInspectReadRepository) : IGovernanceStickinessFacade
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IFindingDispositionService _findingDispositionService =
        findingDispositionService ?? throw new ArgumentNullException(nameof(findingDispositionService));

    private readonly IRiskExceptionService _riskExceptionService =
        riskExceptionService ?? throw new ArgumentNullException(nameof(riskExceptionService));

    private readonly IArchitectureRiskRegisterService _riskRegisterService =
        riskRegisterService ?? throw new ArgumentNullException(nameof(riskRegisterService));

    private readonly IArchitectureDecisionRegisterService _decisionRegisterService =
        decisionRegisterService ?? throw new ArgumentNullException(nameof(decisionRegisterService));

    private readonly IArchitectureReviewRecurrenceScheduleRepository _recurrenceScheduleRepository =
        recurrenceScheduleRepository ?? throw new ArgumentNullException(nameof(recurrenceScheduleRepository));

    private readonly IArchitectureReviewRecurrenceNextRunCalculator _recurrenceNextRunCalculator =
        recurrenceNextRunCalculator ?? throw new ArgumentNullException(nameof(recurrenceNextRunCalculator));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IFindingMergeConflictResolutionService _findingMergeConflictResolutionService =
        findingMergeConflictResolutionService
        ?? throw new ArgumentNullException(nameof(findingMergeConflictResolutionService));

    private readonly IGovernanceDigestDecisionNeededComposer _governanceDigestDecisionNeededComposer =
        governanceDigestDecisionNeededComposer
        ?? throw new ArgumentNullException(nameof(governanceDigestDecisionNeededComposer));

    private readonly IReviewsAwaitingActionQueryService _reviewsAwaitingActionQueryService =
        reviewsAwaitingActionQueryService
        ?? throw new ArgumentNullException(nameof(reviewsAwaitingActionQueryService));

    private readonly IRealizedValueAttestationService _attestationService =
        attestationService ?? throw new ArgumentNullException(nameof(attestationService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IFindingInspectReadRepository _findingInspectReadRepository =
        findingInspectReadRepository ?? throw new ArgumentNullException(nameof(findingInspectReadRepository));

    /// <inheritdoc />
    public async Task<ArchitectureRiskRegisterResponse> GetRiskRegisterAsync(
        Guid? projectId,
        int maxRows,
        bool assignedToMe,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (!GovernanceQueryProjectScope.TryResolve(projectId, scope, out Guid resolvedProjectId))
            return new ArchitectureRiskRegisterResponse { Entries = [] };

        ArchitectureRiskRegisterListOptions? options = null;

        if (assignedToMe)
        {
            IReadOnlyList<string> identities =
                ArchitectureRiskRegisterAssignedToMeIdentityResolver.Resolve(_actorContext);

            if (identities.Count == 0)
                return new ArchitectureRiskRegisterResponse { Entries = [] };

            options = new ArchitectureRiskRegisterListOptions
            {
                AssignedToUserIds = identities,
                OpenFindingsOnly = true,
            };
        }

        return await _riskRegisterService.GetRegisterAsync(
            scope.TenantId,
            resolvedProjectId,
            Math.Clamp(maxRows, 1, 500),
            options,
            ct);
    }

    /// <inheritdoc />
    public async Task<int> GetAssignedToMeFindingsCountAsync(Guid? projectId, CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (!GovernanceQueryProjectScope.TryResolve(projectId, scope, out Guid resolvedProjectId))
            return 0;

        IReadOnlyList<string> identities =
            ArchitectureRiskRegisterAssignedToMeIdentityResolver.Resolve(_actorContext);

        if (identities.Count == 0)
            return 0;

        ArchitectureRiskRegisterListOptions options = new()
        {
            AssignedToUserIds = identities,
            OpenFindingsOnly = true,
        };

        return await _riskRegisterService.CountAsync(
            scope.TenantId,
            resolvedProjectId,
            options,
            ct);
    }

    /// <inheritdoc />
    public async Task<GovernanceReviewsAwaitingActionResponse> GetReviewsAwaitingActionAsync(CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _reviewsAwaitingActionQueryService.ListAsync(scope, ct);
    }

    /// <inheritdoc />
    public async Task<GovernanceDecisionsNeededSummaryResponse> GetDecisionsNeededSummaryAsync(
        Guid? projectId,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (!GovernanceQueryProjectScope.TryResolve(projectId, scope, out Guid resolvedProjectId))
            return new GovernanceDecisionsNeededSummaryResponse();

        return await _governanceDigestDecisionNeededComposer.BuildSummaryAsync(
            scope.TenantId,
            resolvedProjectId,
            ct);
    }

    /// <inheritdoc />
    public async Task<GovernanceFindingsRegistersBundleResponse> GetFindingsRegistersBundleAsync(
        Guid? projectId,
        int maxRows,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        int take = Math.Clamp(maxRows, 1, 500);

        if (!GovernanceQueryProjectScope.TryResolve(projectId, scope, out Guid resolvedProjectId))
            return new GovernanceFindingsRegistersBundleResponse();

        Task<ArchitectureRiskRegisterResponse> riskTask = _riskRegisterService.GetRegisterAsync(
            scope.TenantId,
            resolvedProjectId,
            take,
            options: null,
            ct);

        Task<ArchitectureDecisionRegisterResponse> decisionTask = _decisionRegisterService.GetRegisterAsync(
            scope.TenantId,
            resolvedProjectId,
            take,
            filters: new ArchitectureDecisionRegisterQueryOptions(),
            ct);

        await Task.WhenAll(riskTask, decisionTask).ConfigureAwait(false);

        return new GovernanceFindingsRegistersBundleResponse
        {
            RiskRegister = await riskTask.ConfigureAwait(false),
            DecisionRegister = await decisionTask.ConfigureAwait(false),
        };
    }

    /// <inheritdoc />
    public async Task<ArchitectureDecisionRegisterResponse> GetDecisionRegisterAsync(
        Guid? projectId,
        int maxRows,
        ArchitectureDecisionRegisterQueryOptions filters,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (!GovernanceQueryProjectScope.TryResolve(projectId, scope, out Guid resolvedProjectId))
            return new ArchitectureDecisionRegisterResponse();

        return await _decisionRegisterService.GetRegisterAsync(
            scope.TenantId,
            resolvedProjectId,
            Math.Clamp(maxRows, 1, 500),
            filters,
            ct);
    }
}
