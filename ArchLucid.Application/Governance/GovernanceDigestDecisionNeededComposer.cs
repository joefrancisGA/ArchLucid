using System.Text;

using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Advisory.Scheduling;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance;

public sealed class GovernanceDigestDecisionNeededComposer(
    IGovernanceApprovalRequestRepository approvalRepository,
    IArchitectureRiskRegisterService riskRegisterService,
    IRiskExceptionService riskExceptionService,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IArchitectureDigestRepository digestRepository,
    IExecutiveRoiSummaryService executiveRoiSummaryService) : IGovernanceDigestDecisionNeededComposer
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

    public async Task<GovernanceDecisionsNeededSummaryResponse> BuildSummaryAsync(
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        IReadOnlyList<GovernanceApprovalRequest> pending =
            await _approvalRepository.GetPendingAsync(50, cancellationToken);

        ArchitectureRiskRegisterResponse register =
            await _riskRegisterService.GetRegisterAsync(tenantId, projectId, 100, cancellationToken);

        int staleCount = register.Entries.Count(static e => e.IsStale);
        int unownedHighCount = register.Entries
            .Count(static e => string.IsNullOrWhiteSpace(e.OwnerUserId) && IsHighSeverity(e.Severity));

        DateTimeOffset now = TimeProvider.System.UtcNowDateTime();
        DateTimeOffset since = now.Subtract(TimeSpan.FromDays(30));
        IReadOnlyList<FindingReviewEventRecord> recent =
            await _findingReviewTrailRepository.ListSinceUtcAsync(tenantId, since, cancellationToken);

        int needsEvidenceCount = recent
            .Where(e => e.Disposition == Disposition.NeedsEvidence)
            .GroupBy(static e => e.FindingId, StringComparer.OrdinalIgnoreCase)
            .Count();

        int deferredDueCount = recent
            .Count(e => e.Disposition == Disposition.Deferred && e.RevisitDueUtc is not null && e.RevisitDueUtc <= now);

        IReadOnlyList<RiskExceptionRecord> activeWaivers =
            await _riskExceptionService.ListActiveAsync(tenantId, projectId, cancellationToken);

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

    private async Task<string?> TryBuildDigestDeltaMarkdownAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        CancellationToken cancellationToken)
    {
        if (projectId is null || projectId == Guid.Empty)
            return null;

        IReadOnlyList<ArchitectureDigest> digests = await digestRepository.ListByScopeAsync(
            tenantId,
            workspaceId,
            projectId.Value,
            take: 2,
            ct: cancellationToken);

        if (digests.Count < 2)
            return null;

        ArchitectureDigest latest = digests[0];
        ArchitectureDigest prior = digests[1];
        StringBuilder delta = new();
        delta.AppendLine("## What changed since last digest");
        delta.AppendLine();
        delta.AppendLine($"- Previous digest: {prior.GeneratedUtc:u} — {prior.Title}");
        delta.AppendLine($"- Latest digest: {latest.GeneratedUtc:u} — {latest.Title}");

        if (latest.RunId.HasValue && prior.RunId.HasValue && latest.RunId != prior.RunId)
            delta.AppendLine($"- Target run changed: `{prior.RunId:N}` → `{latest.RunId:N}`.");

        return delta.ToString().TrimEnd();
    }

    private async Task<string?> TryBuildValueDeliveredMarkdownAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        CancellationToken cancellationToken)
    {
        if (projectId is null || projectId == Guid.Empty)
            return null;

        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId.Value };
        ExecutiveRoiSummaryResponse roi;

        using (AmbientScopeContext.Push(scope))
        {
            roi = await executiveRoiSummaryService.BuildAsync(cancellationToken);
        }

        StringBuilder value = new();
        value.AppendLine("## Value delivered (scope)");
        value.AppendLine();
        value.AppendLine($"- Estimated USD savings (latest runs): **{roi.TotalEstimatedUsdSavings:N0}**");
        value.AppendLine($"- Systems with committed ROI signal: **{roi.SystemCount}**");
        value.AppendLine($"- Findings resolved (30d, deduped): **{roi.ResolvedFindingsCount30Days}**");

        return value.ToString().TrimEnd();
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
