using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

public sealed partial class GovernanceDigestDecisionNeededComposer
{
    private static bool IsHighSeverity(string severity)
    {
        if (string.IsNullOrWhiteSpace(severity))
            return false;

        string normalized = severity.Trim();
        return string.Equals(normalized, "High", StringComparison.OrdinalIgnoreCase)
               || string.Equals(normalized, "Critical", StringComparison.OrdinalIgnoreCase)
               || string.Equals(normalized, "Error", StringComparison.OrdinalIgnoreCase);
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
}
