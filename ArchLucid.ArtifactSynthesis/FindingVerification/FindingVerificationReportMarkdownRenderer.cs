using System.Globalization;
using System.Text;

using ArchLucid.ArtifactSynthesis.FindingVerification.Models;

namespace ArchLucid.ArtifactSynthesis.FindingVerification;

public static class FindingVerificationReportMarkdownRenderer
{
    public static string Render(FindingVerificationReportDocumentModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        StringBuilder builder = new();
        builder.AppendLine("# Finding verification report");
        builder.AppendLine();
        builder.AppendLine("Linked to the sealed architecture package; does not mutate `ManifestHash`.");
        builder.AppendLine();
        builder.AppendLine("## Package reference");
        builder.AppendLine($"- Run ID: `{model.RunId:D}`");
        builder.AppendLine($"- Report ID: `{model.ReportId:D}`");
        builder.AppendLine($"- Source manifest hash: `{model.SourceManifestHash}`");
        builder.AppendLine($"- Report hash: `{model.ReportHash}`");
        builder.AppendLine($"- Created (UTC): {model.CreatedUtc:O}");

        if (model.VerificationFindingsSnapshotId is Guid verificationSnapshotId)
        {
            builder.AppendLine($"- Verification findings snapshot: `{verificationSnapshotId:D}`");
        }

        builder.AppendLine();
        builder.AppendLine("## Confirmed findings summary");
        AppendSummaryLines(builder, model.Summary);
        builder.AppendLine();
        builder.AppendLine("## Per-finding results");
        builder.AppendLine("| Finding ID | Title | Severity | Status | Trace |");
        builder.AppendLine("| --- | --- | --- | --- | --- |");

        foreach (FindingVerificationReportFindingRow finding in model.Findings)
        {
            builder.Append('|');
            builder.Append(EscapeCell(finding.FindingId));
            builder.Append('|');
            builder.Append(EscapeCell(finding.Title ?? string.Empty));
            builder.Append('|');
            builder.Append(EscapeCell(finding.Severity ?? string.Empty));
            builder.Append('|');
            builder.Append(EscapeCell(finding.Status));
            builder.Append('|');
            builder.Append(EscapeCell(finding.TraceText));
            builder.AppendLine("|");
        }

        return builder.ToString();
    }

    private static void AppendSummaryLines(StringBuilder builder, Core.Findings.FindingVerificationReportConfirmedRateSummary summary)
    {
        builder.AppendLine($"- Total findings scored: {summary.TotalResults}");
        builder.AppendLine($"- Materialized: {summary.MaterializedCount}");
        builder.AppendLine($"- Mitigated: {summary.MitigatedCount}");
        builder.AppendLine($"- Not observed: {summary.NotObservedCount}");
        builder.AppendLine($"- Not verifiable: {summary.NotVerifiableCount}");

        if (summary.ConfirmedRate is double rate)
        {
            builder.AppendLine(
                $"- **Findings confirmed rate:** {rate.ToString("P1", CultureInfo.InvariantCulture)} "
                + $"(basis: {summary.ConfirmedNumerator}/{summary.VerifiableDenominator} verifiable findings; "
                + "excludes Not verifiable from denominator)");
        }
        else
        {
            builder.AppendLine("- **Findings confirmed rate:** not computed (no verifiable findings in this report)");
        }
    }

    private static string EscapeCell(string value) =>
        value.Replace("|", "/", StringComparison.Ordinal).Replace("\n", " ", StringComparison.Ordinal);
}
