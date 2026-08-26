using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance;

public sealed partial class GovernanceDigestDecisionNeededComposer
{
    public async Task<GovernanceDecisionsNeededSummaryResponse> BuildSummaryAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (workspaceId == Guid.Empty)
            throw new ArgumentException("Workspace id is required.", nameof(workspaceId));

        DateTimeOffset now = TimeProvider.System.UtcNowDateTime();
        DateTimeOffset since = now.Subtract(TimeSpan.FromDays(30));

        Task<IReadOnlyList<GovernanceApprovalRequest>> pendingTask =
            _approvalRepository.GetPendingAsync(50, cancellationToken);
        Task<ArchitectureRiskRegisterResponse> registerTask =
            _riskRegisterService.GetRegisterAsync(tenantId, workspaceId, projectId, 100, options: null, cancellationToken);
        Task<IReadOnlyList<FindingReviewEventRecord>> recentTask =
            _findingReviewTrailRepository.ListSinceUtcAsync(tenantId, since, cancellationToken);
        Task<IReadOnlyList<RiskExceptionRecord>> activeWaiversTask =
            _riskExceptionService.ListActiveAsync(tenantId, projectId, cancellationToken);

        await Task.WhenAll(pendingTask, registerTask, recentTask, activeWaiversTask);

        IReadOnlyList<GovernanceApprovalRequest> pending = await pendingTask;
        ArchitectureRiskRegisterResponse register = await registerTask;
        IReadOnlyList<FindingReviewEventRecord> recent = FilterTrailToScope(
            await recentTask,
            workspaceId,
            projectId);
        IReadOnlyList<RiskExceptionRecord> activeWaivers = FilterWaiversToScope(
            await activeWaiversTask,
            workspaceId,
            projectId);

        int staleCount = StaleArchitectureRiskCountCalculator.CountStale(register);
        int unownedHighCount = register.Entries
            .Count(static e => string.IsNullOrWhiteSpace(e.OwnerUserId) && IsHighSeverity(e.Severity));

        int needsEvidenceCount = recent
            .Where(e => e.Disposition == Disposition.NeedsEvidence)
            .GroupBy(static e => e.FindingId, StringComparer.OrdinalIgnoreCase)
            .Count();

        int deferredDueCount = recent
            .Count(e => e.Disposition == Disposition.Deferred && e.RevisitDueUtc is not null && e.RevisitDueUtc <= now);

        int waiversExpiringCount = GovernanceWaiverExpiryWindow.CountExpiringWithinDays(
            activeWaivers,
            now,
            GovernanceWaiverExpiryWindow.DefaultExpiringWithinDays);

        int total = GovernanceDecisionsNeededSummaryCalculator.ComputeTotalDecisionItems(
            pending.Count,
            register,
            recent,
            activeWaivers,
            now);

        return new GovernanceDecisionsNeededSummaryResponse
        {
            PendingApprovals = pending.Count,
            StaleRisks = staleCount,
            UnownedHighSeverityRisks = unownedHighCount,
            FindingsAwaitingEvidence = needsEvidenceCount,
            WaiversExpiringWithin14Days = waiversExpiringCount,
            DeferredFindingsDue = deferredDueCount,
            TotalDecisionItems = total,
        };
    }
}
