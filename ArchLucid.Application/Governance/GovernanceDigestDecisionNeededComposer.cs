using System.Text;

using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance;

public sealed partial class GovernanceDigestDecisionNeededComposer(
    IGovernanceApprovalRequestRepository approvalRepository,
    IArchitectureRiskRegisterService riskRegisterService,
    IRiskExceptionService riskExceptionService,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IArchitectureDigestRepository digestRepository,
    ISponsorRoiSummaryService SponsorRoiSummaryService) : IGovernanceDigestDecisionNeededComposer
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
        Guid workspaceId,
        Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (workspaceId == Guid.Empty)
            throw new ArgumentException("Workspace id is required.", nameof(workspaceId));

        StringBuilder decisionNeeded = new();
        StringBuilder fyi = new();
        bool hasDecisionContent = false;
        bool hasFyiContent = false;

        DateTimeOffset now = TimeProvider.System.UtcNowDateTime();
        DateTimeOffset since = now.Subtract(TimeSpan.FromDays(30));

        // Independent fan-in — approvals, risk register, review trail, and active waivers do not depend on each other.
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

        if (pending.Count > 0)
        {
            hasDecisionContent = true;
            decisionNeeded.AppendLine("### Approvals pending");
            foreach (GovernanceApprovalRequest approval in pending.Take(10))

                decisionNeeded.AppendLine($"- `{approval.ApprovalRequestId:N}` — run `{approval.RunId:N}` → {approval.TargetEnvironment}");
        }

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

        string? digestDelta = await TryBuildDigestDeltaMarkdownAsync(
            tenantId,
            workspaceId,
            projectId,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(digestDelta))
        {
            output.AppendLine();
            output.AppendLine();
            output.Append(digestDelta);
        }

        string? valueDelivered = await TryBuildValueDeliveredMarkdownAsync(
            tenantId,
            workspaceId,
            projectId,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(valueDelivered))
        {
            output.AppendLine();
            output.AppendLine();
            output.Append(valueDelivered);
        }

        return output.ToString().TrimEnd();
    }
}
