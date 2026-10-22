using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Default <see cref="IGovernanceInsightsFacade"/> consolidating governance insights route orchestration previously
///     in <c>GovernanceController.Insights</c>.
/// </summary>
public sealed class GovernanceInsightsFacade(
    IGovernanceDashboardService governanceDashboardService,
    IGovernanceLineageService governanceLineageService,
    IGovernanceRationaleService governanceRationaleService,
    IComplianceDriftTrendService complianceDriftTrendService,
    IGovernanceApprovalRequestRepository approvalRepo,
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository) : IGovernanceInsightsFacade
{
    private readonly IGovernanceDashboardService _governanceDashboardService =
        governanceDashboardService ?? throw new ArgumentNullException(nameof(governanceDashboardService));

    private readonly IGovernanceLineageService _governanceLineageService =
        governanceLineageService ?? throw new ArgumentNullException(nameof(governanceLineageService));

    private readonly IGovernanceRationaleService _governanceRationaleService =
        governanceRationaleService ?? throw new ArgumentNullException(nameof(governanceRationaleService));

    private readonly IComplianceDriftTrendService _complianceDriftTrendService =
        complianceDriftTrendService ?? throw new ArgumentNullException(nameof(complianceDriftTrendService));

    private readonly IGovernanceApprovalRequestRepository _approvalRepo =
        approvalRepo ?? throw new ArgumentNullException(nameof(approvalRepo));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    /// <inheritdoc />
    public Task<GovernanceDashboardSummary> GetDashboardAsync(
        Guid tenantId,
        int maxPending,
        int maxDecisions,
        int maxChanges,
        CancellationToken ct) =>
        _governanceDashboardService.GetDashboardAsync(tenantId, maxPending, maxDecisions, maxChanges, ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<ComplianceDriftTrendPoint>> GetComplianceDriftTrendAsync(
        Guid tenantId,
        DateTime fromUtc,
        DateTime toUtc,
        TimeSpan bucketSize,
        CancellationToken ct) =>
        _complianceDriftTrendService.GetTrendAsync(tenantId, fromUtc, toUtc, bucketSize, ct);

    /// <inheritdoc />
    public async Task<GovernanceLineageResult?> GetApprovalRequestLineageAsync(
        string approvalRequestId,
        CancellationToken ct)
    {
        await RequireScopedApprovalRequestAsync(approvalRequestId, ct);

        return await _governanceLineageService.GetApprovalRequestLineageAsync(approvalRequestId, ct);
    }

    /// <inheritdoc />
    public async Task<GovernanceRationaleResult?> GetApprovalRequestRationaleAsync(
        string approvalRequestId,
        CancellationToken ct)
    {
        await RequireScopedApprovalRequestAsync(approvalRequestId, ct);

        return await _governanceRationaleService.GetApprovalRequestRationaleAsync(approvalRequestId, ct);
    }

    private async Task RequireScopedApprovalRequestAsync(string approvalRequestId, CancellationToken ct)
    {
        GovernanceApprovalRequest? approval = await _approvalRepo
            .GetByIdAsync(approvalRequestId, ct)
            .ConfigureAwait(false);

        if (approval is null)
            throw new KeyNotFoundException($"Approval request '{approvalRequestId}' was not found.");

        await GovernanceRunScope.RequireScopedRunIdAsync(
            _scopeContextProvider,
            _runRepository,
            approval.RunId,
            ct);
    }
}
