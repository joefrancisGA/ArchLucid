using System.Text;

using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Advisory.Scheduling;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance;

public sealed partial class GovernanceDigestDecisionNeededComposer
{
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
        SponsorRoiSummaryResponse roi;

        using (AmbientScopeContext.Push(scope))
        {
            roi = await SponsorRoiSummaryService.BuildAsync(cancellationToken);
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
        foreach (int daysBefore in GovernanceWaiverExpiryWindow.AlertDayBoundaries)
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
}
