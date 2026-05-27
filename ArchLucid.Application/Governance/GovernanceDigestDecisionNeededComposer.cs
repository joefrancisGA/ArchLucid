using System.Text;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Governance;

public sealed class GovernanceDigestDecisionNeededComposer(
    IGovernanceApprovalRequestRepository approvalRepository,
    IArchitectureRiskRegisterService riskRegisterService,
    IRiskExceptionService riskExceptionService,
    IFindingReviewTrailRepository findingReviewTrailRepository) : IGovernanceDigestDecisionNeededComposer
{
    private readonly IGovernanceApprovalRequestRepository _approvalRepository =
        approvalRepository ?? throw new ArgumentNullException(nameof(approvalRepository));

    private readonly IArchitectureRiskRegisterService _riskRegisterService =
        riskRegisterService ?? throw new ArgumentNullException(nameof(riskRegisterService));

    private readonly IRiskExceptionService _riskExceptionService =
        riskExceptionService ?? throw new ArgumentNullException(nameof(riskExceptionService));

    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    public async Task<string?> BuildDecisionNeededMarkdownAsync(
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        StringBuilder sb = new();
        bool hasContent = false;

        IReadOnlyList<GovernanceApprovalRequest> pending =
            await _approvalRepository.GetPendingAsync(50, cancellationToken);

        if (pending.Count > 0)
        {
            hasContent = true;
            sb.AppendLine("### Approvals pending");
            foreach (GovernanceApprovalRequest approval in pending.Take(10))

                sb.AppendLine($"- `{approval.ApprovalRequestId:N}` — run `{approval.RunId:N}` → {approval.TargetEnvironment}");
        }

        ArchitectureRiskRegisterResponse register =
            await _riskRegisterService.GetRegisterAsync(tenantId, projectId, 100, cancellationToken);

        List<ArchitectureRiskRegisterEntry> stale = register.Entries.Where(static e => e.IsStale).ToList();

        if (stale.Count > 0)
        {
            hasContent = true;
            sb.AppendLine();
            sb.AppendLine("### Stale risks");
            foreach (ArchitectureRiskRegisterEntry entry in stale.Take(10))

                sb.AppendLine($"- **{entry.Title}** ({entry.Severity}) — {entry.StatusLabel} — {entry.EvidenceHref}");
        }

        IReadOnlyList<RiskExceptionRecord> activeWaivers =
            await _riskExceptionService.ListActiveAsync(tenantId, projectId, cancellationToken);

        DateTimeOffset soon = TimeProvider.System.UtcNowDateTime().AddDays(14);
        List<RiskExceptionRecord> expiring = activeWaivers.Where(w => w.ExpiresAtUtc <= soon).ToList();

        if (expiring.Count > 0)
        {
            hasContent = true;
            sb.AppendLine();
            sb.AppendLine("### Expiring waivers (14 days)");
            foreach (RiskExceptionRecord waiver in expiring.Take(10))

                sb.AppendLine($"- Finding `{waiver.FindingId}` — owner `{waiver.OwnerUserId}` — expires {waiver.ExpiresAtUtc:u}");
        }

        DateTimeOffset since = TimeProvider.System.UtcNowDateTime().Subtract(TimeSpan.FromDays(30));
        IReadOnlyList<FindingReviewEventRecord> recent =
            await _findingReviewTrailRepository.ListSinceUtcAsync(tenantId, since, cancellationToken);

        DateTimeOffset now = TimeProvider.System.UtcNowDateTime();
        List<FindingReviewEventRecord> deferredDue = recent
            .Where(e => e.Disposition == ArchLucid.Contracts.Findings.FindingDisposition.Deferred && e.RevisitDueUtc is not null && e.RevisitDueUtc <= now)
            .Take(10)
            .ToList();

        if (deferredDue.Count > 0)
        {
            hasContent = true;
            sb.AppendLine();
            sb.AppendLine("### Deferred findings due for revisit");
            foreach (FindingReviewEventRecord reviewEvent in deferredDue)

                sb.AppendLine($"- `{reviewEvent.FindingId}` — due {reviewEvent.RevisitDueUtc:u}");
        }

        if (!hasContent)
            return null;

        sb.Insert(0, "## Decision needed\n\n");

        return sb.ToString();
    }
}
