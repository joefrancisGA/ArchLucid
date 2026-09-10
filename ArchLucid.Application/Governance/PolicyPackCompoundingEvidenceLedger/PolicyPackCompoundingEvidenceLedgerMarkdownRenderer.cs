using System.Text;

using ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;

namespace ArchLucid.Application.Governance.PolicyPackCompoundingEvidenceLedger;

/// <summary>
///     Renders a compounding-evidence ledger as markdown for internal differentiability review.
/// </summary>
public static class PolicyPackCompoundingEvidenceLedgerMarkdownRenderer
{
    public static string Render(PolicyPackCompoundingEvidenceLedger ledger)
    {
        ArgumentNullException.ThrowIfNull(ledger);

        StringBuilder builder = new();
        builder.AppendLine("# Policy-pack compounding-evidence ledger (TB-885 / DX-18)");
        builder.AppendLine();
        builder.AppendLine("> Internal differentiability instrument — **not** a buyer compounding rate.");
        builder.AppendLine();
        builder.AppendLine($"- **Schema:** `{ledger.Schema}`");
        builder.AppendLine($"- **Generated (UTC):** {ledger.GeneratedUtc:O}");
        builder.AppendLine($"- **Policy pack id:** `{ledger.PolicyPackId:D}`");
        builder.AppendLine($"- **Historical run id:** `{ledger.RunId}`");
        builder.AppendLine($"- **Older version:** `{ledger.OlderVersionLabel}` (gate blocked: {ledger.OlderGateBlocked})");
        builder.AppendLine($"- **Newer version:** `{ledger.NewerVersionLabel}` (gate blocked: {ledger.NewerGateBlocked})");
        builder.AppendLine();
        builder.AppendLine("## Incremental catch (newer vs older on same run)");
        AppendChanges(builder, ledger.IncrementalCatch);
        builder.AppendLine("## Change-log citations");
        AppendChangeLog(builder, ledger.ChangeLogCitations);
        builder.AppendLine("## Claim boundary");
        builder.AppendLine();
        builder.AppendLine(ledger.ClaimBoundaryText);
        builder.AppendLine();

        return builder.ToString();
    }

    private static void AppendChanges(StringBuilder builder, PolicyPackBeforeAfterDiffChangeSet changes)
    {
        builder.AppendLine($"- **Gate blocked flipped:** {changes.GateBlockedFlipped}");
        builder.AppendLine($"- **Added compliance rule keys:** {string.Join(", ", changes.AddedComplianceRuleKeys)}");
        builder.AppendLine($"- **Removed compliance rule keys:** {string.Join(", ", changes.RemovedComplianceRuleKeys)}");
        builder.AppendLine($"- **Findings newly blocking commit:** {string.Join(", ", changes.FindingsNewlyBlockingCommit)}");
        builder.AppendLine($"- **Findings no longer blocking commit:** {string.Join(", ", changes.FindingsNoLongerBlockingCommit)}");
        builder.AppendLine();
    }

    private static void AppendChangeLog(StringBuilder builder, IReadOnlyList<PolicyPackCompoundingEvidenceChangeLogCitation> citations)
    {
        if (citations.Count == 0)
        {
            builder.AppendLine("- _(none)_");
            builder.AppendLine();

            return;
        }

        foreach (PolicyPackCompoundingEvidenceChangeLogCitation citation in citations)
        {
            builder.AppendLine(
                $"- `{citation.ChangeLogId:D}` `{citation.ChangeType}` @ {citation.ChangedUtc:O} — {citation.SummaryText}");
        }

        builder.AppendLine();
    }
}
