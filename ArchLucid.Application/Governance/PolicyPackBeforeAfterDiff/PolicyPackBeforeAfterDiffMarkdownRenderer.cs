using System.Text;

namespace ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;

/// <summary>
///     Renders a <see cref="PolicyPackBeforeAfterDiffArtifact" /> as markdown for sales/demo walkthroughs.
/// </summary>
public static class PolicyPackBeforeAfterDiffMarkdownRenderer
{
    public static string Render(PolicyPackBeforeAfterDiffArtifact artifact)
    {
        ArgumentNullException.ThrowIfNull(artifact);

        StringBuilder builder = new();
        builder.AppendLine("# Policy pack before/after diff (synthetic demo)");
        builder.AppendLine();
        builder.AppendLine($"- **Demo label:** {artifact.DemoLabel}");
        builder.AppendLine($"- **Run id:** `{artifact.RunId}`");
        builder.AppendLine();
        builder.AppendLine("## Configuration A (before)");
        AppendSnapshot(builder, artifact.Before);
        builder.AppendLine("## Configuration B (after)");
        AppendSnapshot(builder, artifact.After);
        builder.AppendLine("## Changes");
        AppendChanges(builder, artifact.Changes);
        builder.AppendLine("## Audit trail citations");
        AppendAudit(builder, artifact.AuditTrailCitations);

        return builder.ToString();
    }

    private static void AppendSnapshot(StringBuilder builder, PolicyPackBeforeAfterConfigurationSnapshot snapshot)
    {
        builder.AppendLine($"- **Label:** {snapshot.ConfigurationLabel}");
        builder.AppendLine($"- **Priority floor:** {snapshot.PriorityFloor}");
        builder.AppendLine($"- **Gate blocked:** {snapshot.GateBlocked}");
        builder.AppendLine($"- **Active compliance rules:** {string.Join(", ", snapshot.ActiveComplianceRuleKeysOrdered)}");
        builder.AppendLine("- **Findings:**");

        foreach (PolicyPackBeforeAfterFindingLine finding in snapshot.Findings)
        {
            builder.AppendLine(
                $"  - `{finding.FindingId}` ({finding.Severity}) — blocks commit: {finding.BlocksCommitUnderConfiguration}");
        }

        builder.AppendLine("- **Sponsor report lines:**");

        foreach (string line in snapshot.SponsorReportLines)
        {
            builder.AppendLine($"  - {line}");
        }

        builder.AppendLine();
    }

    private static void AppendChanges(StringBuilder builder, PolicyPackBeforeAfterDiffChangeSet changes)
    {
        builder.AppendLine($"- **Gate blocked flipped:** {changes.GateBlockedFlipped}");
        builder.AppendLine($"- **Added compliance rule keys:** {string.Join(", ", changes.AddedComplianceRuleKeys)}");
        builder.AppendLine($"- **Removed compliance rule keys:** {string.Join(", ", changes.RemovedComplianceRuleKeys)}");
        builder.AppendLine($"- **Findings newly blocking commit:** {string.Join(", ", changes.FindingsNewlyBlockingCommit)}");
        builder.AppendLine($"- **Findings no longer blocking commit:** {string.Join(", ", changes.FindingsNoLongerBlockingCommit)}");
        builder.AppendLine("- **Sponsor report lines added:**");

        foreach (string line in changes.SponsorReportLinesAdded)
        {
            builder.AppendLine($"  - {line}");
        }

        builder.AppendLine("- **Sponsor report lines removed:**");

        foreach (string line in changes.SponsorReportLinesRemoved)
        {
            builder.AppendLine($"  - {line}");
        }

        builder.AppendLine();
    }

    private static void AppendAudit(StringBuilder builder, IReadOnlyList<PolicyPackBeforeAfterAuditCitation> citations)
    {
        if (citations.Count == 0)
        {
            builder.AppendLine("- _(none)_");
            builder.AppendLine();

            return;
        }

        foreach (PolicyPackBeforeAfterAuditCitation citation in citations)
        {
            builder.AppendLine(
                $"- `{citation.EventType}` assignment `{citation.AssignmentId}` pack `{citation.PolicyPackId}` version `{citation.PolicyPackVersion}` run `{citation.RunId}`");
        }

        builder.AppendLine();
    }
}
