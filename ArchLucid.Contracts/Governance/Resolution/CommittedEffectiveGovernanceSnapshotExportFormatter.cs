using System.Globalization;
using System.Text;

namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>
///     Human-readable formatting for <see cref="CommittedEffectiveGovernanceSnapshotDescriptor" /> in exports and README text.
/// </summary>
public static class CommittedEffectiveGovernanceSnapshotExportFormatter
{
    /// <summary>One-line headline for README and provenance summaries.</summary>
    public static string? FormatReadmeHeadline(CommittedEffectiveGovernanceSnapshotDescriptor? snapshot)
    {
        if (snapshot is null)
            return null;

        if (!snapshot.HasEffectivePolicy)
            return "no effective policy assignments or compliance rule keys";

        return string.Create(
            CultureInfo.InvariantCulture,
            $"{snapshot.PackAssignments.Count} pack assignment(s), {snapshot.ComplianceRuleKeyCount} compliance rule key(s)");
    }

    /// <summary>Detail lines listing pack assignments, dimensions, and exclusions for offline README exports.</summary>
    public static IReadOnlyList<string> FormatReadmeDetailLines(CommittedEffectiveGovernanceSnapshotDescriptor? snapshot)
    {
        if (snapshot is null || !snapshot.HasEffectivePolicy)
            return [];

        List<string> lines = [];

        foreach (CommittedGovernancePackAssignmentSnapshot row in snapshot.PackAssignments)
        {
            lines.Add(
                string.Create(
                    CultureInfo.InvariantCulture,
                    $"  Pack: {row.PolicyPackId:D} v{row.PolicyPackVersion} ({row.ScopeLevel})"));
        }

        AppendCoverageDetailLines(lines, snapshot.CoverageAssignments);

        if (snapshot.ConflictCount > 0)
        {
            lines.Add(
                string.Create(
                    CultureInfo.InvariantCulture,
                    $"  Merge conflicts at commit: {snapshot.ConflictCount}"));
        }

        return lines;
    }

    /// <summary>Rows appended to DOCX provenance appendix after applied-rule counts.</summary>
    public static IReadOnlyList<(string Label, string Value)> FormatProvenanceAppendixRows(
        CommittedEffectiveGovernanceSnapshotDescriptor? snapshot)
    {
        if (snapshot is null)
            return [];

        List<(string Label, string Value)> rows =
        [
            ("Policy at commit", FormatReadmeHeadline(snapshot) ?? "not recorded")
        ];

        if (!snapshot.HasEffectivePolicy)
            return rows;

        if (snapshot.PackAssignments.Count > 0)
        {
            StringBuilder packs = new();

            foreach (CommittedGovernancePackAssignmentSnapshot row in snapshot.PackAssignments)
            {
                if (packs.Length > 0)
                    packs.AppendLine();

                packs.Append(
                    string.Create(
                        CultureInfo.InvariantCulture,
                        $"{row.PolicyPackId:D} v{row.PolicyPackVersion} ({row.ScopeLevel})"));
            }

            rows.Add(("Pack assignments at commit", packs.ToString()));
        }

        AppendCoverageAppendixRows(rows, snapshot.CoverageAssignments);

        if (snapshot.ComplianceRuleKeyCount > 0)
        {
            rows.Add(
                ("Compliance rule keys at commit", snapshot.ComplianceRuleKeyCount.ToString(CultureInfo.InvariantCulture)));
        }

        if (snapshot.ConflictCount > 0)
        {
            rows.Add(
                ("Merge conflicts at commit", snapshot.ConflictCount.ToString(CultureInfo.InvariantCulture)));
        }

        return rows;
    }

    private static void AppendCoverageDetailLines(
        List<string> lines,
        IReadOnlyList<CommittedCoverageAssignmentSnapshot> coverageAssignments)
    {
        foreach (CommittedCoverageAssignmentSnapshot row in coverageAssignments)
        {
            StringBuilder line = new();
            line.Append("  Coverage: ");
            line.Append(row.PolicyPackId.ToString("D", CultureInfo.InvariantCulture));
            line.Append(" v");
            line.Append(row.PolicyPackVersion);

            if (!string.IsNullOrWhiteSpace(row.QualityDimension))
            {
                line.Append(" · ");
                line.Append(row.QualityDimension.Trim());
            }

            line.Append(" · ");
            line.Append(row.CoverageType.Trim());
            line.Append(" · ");
            line.Append(row.SelectionState.Trim());

            if (!string.IsNullOrWhiteSpace(row.ExclusionReason))
            {
                line.Append(" · excluded: ");
                line.Append(row.ExclusionReason.Trim());
            }

            lines.Add(line.ToString());
        }
    }

    private static void AppendCoverageAppendixRows(
        List<(string Label, string Value)> rows,
        IReadOnlyList<CommittedCoverageAssignmentSnapshot> coverageAssignments)
    {
        if (coverageAssignments.Count == 0)
            return;

        StringBuilder coverage = new();

        foreach (CommittedCoverageAssignmentSnapshot row in coverageAssignments)
        {
            if (coverage.Length > 0)
                coverage.AppendLine();

            coverage.Append(
                string.Create(
                    CultureInfo.InvariantCulture,
                    $"{row.PolicyPackId:D} v{row.PolicyPackVersion}"));

            if (!string.IsNullOrWhiteSpace(row.QualityDimension))
            {
                coverage.Append(" · ");
                coverage.Append(row.QualityDimension.Trim());
            }

            coverage.Append(" · ");
            coverage.Append(row.CoverageType.Trim());
            coverage.Append(" · ");
            coverage.Append(row.SelectionState.Trim());

            if (!string.IsNullOrWhiteSpace(row.ExclusionReason))
            {
                coverage.Append(" · excluded: ");
                coverage.Append(row.ExclusionReason.Trim());
            }
        }

        rows.Add(("Coverage assignments at commit", coverage.ToString()));
    }
}
