using System.Text;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance;

public sealed class GovernanceDigestDecisionNeededComposer(
    IGovernanceApprovalRequestRepository approvalRepository,
    IArchitectureRiskRegisterService riskRegisterService,
    IRiskExceptionService riskExceptionService,
    IFindingReviewTrailRepository findingReviewTrailRepository) : IGovernanceDigestDecisionNeededComposer
{
    private static readonly int[] WaiverExpiryAlertDays = [30, 14, 7, 0];

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

        StringBuilder decisionNeeded = new();
        StringBuilder fyi = new();
        bool hasDecisionContent = false;
        bool hasFyiContent = false;

        IReadOnlyList<GovernanceApprovalRequest> pending =
            await _approvalRepository.GetPendingAsync(50, cancellationToken);

        if (pending.Count > 0)
        {
            hasDecisionContent = true;
            decisionNeeded.AppendLine("### Approvals pending");
            foreach (GovernanceApprovalRequest approval in pending.Take(10))

                decisionNeeded.AppendLine($"- `{approval.ApprovalRequestId:N}` — run `{approval.RunId:N}` → {approval.TargetEnvironment}");
        }

        ArchitectureRiskRegisterResponse register =
            await _riskRegisterService.GetRegisterAsync(tenantId, projectId, 100, cancellationToken);

        List<ArchitectureRiskRegisterEntry> stale = register.Entries.Where(static e => e.IsStale).ToList();

        if (stale.Count > 0)
        {
            hasDecisionContent = true;
            decisionNeeded.AppendLine();
            decisionNeeded.AppendLine("### Stale risks");
            foreach (ArchitectureRiskRegisterEntry entry in stale.Take(10))

                decisionNeeded.AppendLine($"- **{entry.Title}** ({entry.Severity}) — {entry.StatusLabel} — [{entry.FindingId}]({entry.EvidenceHref})");
        }

        List<ArchitectureRiskRegisterEntry> unownedHigh = register.Entries
            .Where(static e => string.IsNullOrWhiteSpace(e.OwnerUserId))
            .Where(static e => IsHighSeverity(e.Severity))
            .Take(10)
            .ToList();

        if (unownedHigh.Count > 0)
        {
            hasDecisionContent = true;
            decisionNeeded.AppendLine();
            decisionNeeded.AppendLine("### Unowned high-severity risks");
            foreach (ArchitectureRiskRegisterEntry entry in unownedHigh)

                decisionNeeded.AppendLine($"- **{entry.Title}** — assign owner — [{entry.FindingId}]({entry.EvidenceHref})");
        }

        DateTimeOffset now = TimeProvider.System.UtcNowDateTime();
        DateTimeOffset since = now.Subtract(TimeSpan.FromDays(30));
        IReadOnlyList<FindingReviewEventRecord> recent =
            await _findingReviewTrailRepository.ListSinceUtcAsync(tenantId, since, cancellationToken);

        List<FindingReviewEventRecord> needsEvidence = recent
            .Where(e => e.Disposition == Disposition.NeedsEvidence)
            .GroupBy(static e => e.FindingId, StringComparer.OrdinalIgnoreCase)
            .Select(static g => g.OrderByDescending(static e => e.OccurredAtUtc).First())
            .Take(10)
            .ToList();

        if (needsEvidence.Count > 0)
        {
            hasDecisionContent = true;
            decisionNeeded.AppendLine();
            decisionNeeded.AppendLine("### Findings awaiting evidence");
            foreach (FindingReviewEventRecord reviewEvent in needsEvidence)

                decisionNeeded.AppendLine($"- `{reviewEvent.FindingId}` — {reviewEvent.EvidenceRequestText ?? "Evidence requested"}");
        }

        IReadOnlyList<RiskExceptionRecord> activeWaivers =
            await _riskExceptionService.ListActiveAsync(tenantId, projectId, cancellationToken);

        AppendWaiverExpirySections(decisionNeeded, activeWaivers, now, ref hasDecisionContent);

        List<FindingReviewEventRecord> deferredDue = recent
            .Where(e => e.Disposition == Disposition.Deferred && e.RevisitDueUtc is not null && e.RevisitDueUtc <= now)
            .Take(10)
            .ToList();

        if (deferredDue.Count > 0)
        {
            hasDecisionContent = true;
            decisionNeeded.AppendLine();
            decisionNeeded.AppendLine("### Deferred findings due for revisit");
            foreach (FindingReviewEventRecord reviewEvent in deferredDue)

                decisionNeeded.AppendLine($"- `{reviewEvent.FindingId}` — due {reviewEvent.RevisitDueUtc:u}");
        }

        int remediatedCount = recent.Count(e => e.Disposition == Disposition.Remediated);

        if (remediatedCount > 0)
        {
            hasFyiContent = true;
            fyi.AppendLine($"- {remediatedCount} finding(s) marked remediated in the last 30 days.");
        }

        if (activeWaivers.Count > 0)
        {
            hasFyiContent = true;
            fyi.AppendLine($"- {activeWaivers.Count} active waiver(s) on record.");
        }

        if (!hasDecisionContent && !hasFyiContent)
            return null;

        StringBuilder output = new();

        if (hasDecisionContent)
        {
            output.AppendLine("## Decision needed");
            output.AppendLine();
            output.Append(decisionNeeded);
        }

        if (hasFyiContent)
        {
            if (hasDecisionContent)
                output.AppendLine();

            output.AppendLine("## FYI");
            output.AppendLine();
            output.Append(fyi);
        }

        return output.ToString().TrimEnd();
    }

    private static void AppendWaiverExpirySections(
        StringBuilder decisionNeeded,
        IReadOnlyList<RiskExceptionRecord> activeWaivers,
        DateTimeOffset now,
        ref bool hasDecisionContent)
    {
        foreach (int daysBefore in WaiverExpiryAlertDays)
        {
            DateTimeOffset windowStart = now.Date.AddDays(daysBefore);
            DateTimeOffset windowEnd = windowStart.AddDays(1);
            List<RiskExceptionRecord> bucket = activeWaivers
                .Where(w => w.ExpiresAtUtc >= windowStart && w.ExpiresAtUtc < windowEnd)
                .Take(10)
                .ToList();

            if (bucket.Count == 0)
                continue;

            hasDecisionContent = true;
            decisionNeeded.AppendLine();
            string heading = daysBefore == 0
                ? "### Waivers expiring today"
                : $"### Waivers expiring in {daysBefore} days";

            decisionNeeded.AppendLine(heading);
            foreach (RiskExceptionRecord waiver in bucket)

                decisionNeeded.AppendLine($"- Finding `{waiver.FindingId}` — owner `{waiver.OwnerUserId}` — expires {waiver.ExpiresAtUtc:u}");
        }
    }

    private static bool IsHighSeverity(string severity)
    {
        if (string.IsNullOrWhiteSpace(severity))
            return false;

        return severity.Contains("high", StringComparison.OrdinalIgnoreCase)
               || severity.Contains("critical", StringComparison.OrdinalIgnoreCase);
    }
}
