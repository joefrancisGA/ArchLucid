using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Default <see cref = "IGovernanceDashboardService"/> combining cross-run approval views and tenant-scoped policy
///     change log rows.
/// </summary>
public sealed class GovernanceDashboardService(
    IGovernanceApprovalRequestRepository approvalRequestRepository,
    IPolicyPackChangeLogRepository policyPackChangeLogRepository,
    IRunDetailQueryService runDetailQueryService,
    IAgentExecutionTraceRepository traceRepository,
    IScopeContextProvider scopeContextProvider,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService) : IGovernanceDashboardService
{
    private readonly IGovernanceApprovalRequestRepository _approvalRequestRepository =
        approvalRequestRepository ?? throw new ArgumentNullException(nameof(approvalRequestRepository));

    private readonly IPolicyPackChangeLogRepository _policyPackChangeLogRepository =
        policyPackChangeLogRepository ?? throw new ArgumentNullException(nameof(policyPackChangeLogRepository));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IAgentExecutionTraceRepository _traceRepository =
        traceRepository ?? throw new ArgumentNullException(nameof(traceRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    /// <inheritdoc/>
    public async Task<GovernanceDashboardSummary> GetDashboardAsync(Guid tenantId, int maxPending = 20, int maxDecisions = 20, int maxChanges = 20,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (maxPending <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxPending));

        if (maxDecisions <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxDecisions));

        if (maxChanges <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxChanges));

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        Task<IReadOnlyList<GovernanceApprovalRequest>> pendingTask = _approvalRequestRepository.GetPendingAsync(maxPending, cancellationToken);
        Task<IReadOnlyList<GovernanceApprovalRequest>> decisionsTask = _approvalRequestRepository.GetRecentDecisionsAsync(maxDecisions, cancellationToken);
        Task<IReadOnlyList<PolicyPackChangeLogEntry>> changesTask =
            _policyPackChangeLogRepository.GetByScopeAsync(
                tenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                maxChanges,
                cancellationToken);
        Task<(long PromptTokens, long CompletionTokens)> tokenTask =
            GovernanceDashboardRecentRunTokenAggregator.AggregateAsync(
                _runDetailQueryService,
                _traceRepository,
                _scopeContextProvider,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        await Task.WhenAll(pendingTask, decisionsTask, changesTask, tokenTask);
        IReadOnlyList<GovernanceApprovalRequest> pending = await pendingTask;
        IReadOnlyList<GovernanceApprovalRequest> decisions = await decisionsTask;
        IReadOnlyList<PolicyPackChangeLogEntry> scopedChanges = await changesTask;
        (long promptTokens, long completionTokens) = await tokenTask;

        await GovernanceInsightsSealedManifestHashGuard.EnsureDashboardRunsSealedOrThrowAsync(
            pending,
            decisions,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        return new GovernanceDashboardSummary
        {
            PendingApprovals = pending,
            RecentDecisions = decisions,
            RecentChanges = scopedChanges,
            PendingCount = pending.Count,
            TotalPromptTokens = promptTokens,
            TotalCompletionTokens = completionTokens,
        };
    }
}
