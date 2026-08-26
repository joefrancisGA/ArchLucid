using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

public sealed partial class GovernanceDigestDecisionNeededComposer
{
    private static bool IsHighSeverity(string severity)
    {
        if (string.IsNullOrWhiteSpace(severity))
            return false;

        return severity.Contains("high", StringComparison.OrdinalIgnoreCase)
               || severity.Contains("critical", StringComparison.OrdinalIgnoreCase);
    }

    private static IReadOnlyList<FindingReviewEventRecord> FilterTrailToScope(
        IReadOnlyList<FindingReviewEventRecord> events,
        Guid workspaceId,
        Guid? projectId)
    {
        return events
            .Where(reviewEvent => reviewEvent.WorkspaceId == workspaceId)
            .Where(reviewEvent => projectId is null || projectId == Guid.Empty || reviewEvent.ProjectId == projectId)
            .ToList();
    }

    private static IReadOnlyList<RiskExceptionRecord> FilterWaiversToScope(
        IReadOnlyList<RiskExceptionRecord> waivers,
        Guid workspaceId,
        Guid? projectId)
    {
        return waivers
            .Where(waiver => waiver.WorkspaceId == workspaceId)
            .Where(waiver => projectId is null || projectId == Guid.Empty || waiver.ProjectId == projectId)
            .ToList();
    }
}
