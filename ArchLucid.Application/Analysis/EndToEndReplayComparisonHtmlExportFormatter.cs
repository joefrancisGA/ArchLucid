using System.Net;
using System.Text;

using ArchLucid.Application.Diffs;
using ArchLucid.Application.Findings;

namespace ArchLucid.Application.Analysis;

/// <summary>HTML export for <see cref="EndToEndReplayComparisonReport"/>.</summary>
public static class EndToEndReplayComparisonHtmlExportFormatter
{
    public static string Generate(
        IEndToEndReplayComparisonSummaryFormatter summaryFormatter,
        EndToEndReplayComparisonReport report,
        string? profile = null)
    {
        ArgumentNullException.ThrowIfNull(summaryFormatter);
        ArgumentNullException.ThrowIfNull(report);
        string p = EndToEndComparisonExportProfile.Normalize(profile);
        StringBuilder sb = new();
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html lang=\"en\">");
        sb.AppendLine("<head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>");
        sb.AppendLine("<title>ArchLucid End-to-End Replay Comparison</title>");
        sb.AppendLine("<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:1rem auto;padding:0 1rem;}");
        sb.AppendLine("h1{font-size:1.5rem;} h2{font-size:1.2rem;margin-top:1.25rem;} h3{font-size:1rem;}");
        sb.AppendLine("ul{margin:.5rem 0;} li{margin:.25rem 0;} .meta{color:#555;font-size:0.9rem;}</style>");
        sb.AppendLine("</head><body>");
        sb.AppendLine("<h1>ArchLucid End-to-End Replay Comparison Export</h1>");
        sb.AppendLine("<p class=\"meta\">Left Run ID: " + EscapeHtml(report.LeftRunId) + "</p>");
        sb.AppendLine("<p class=\"meta\">Right Run ID: " + EscapeHtml(report.RightRunId) + "</p>");
        sb.AppendLine("<p class=\"meta\">Generated UTC: " + EscapeHtml(TimeProvider.System.UtcNowDateTime().ToString("O")) + "</p>");
        sb.AppendLine("<p class=\"meta\">Profile: " + EscapeHtml(p) + "</p>");

        if (report.FindingCorrelation is not null)
        {
            ComparisonFindingCorrelationMetadata metadata = report.FindingCorrelation;
            sb.AppendLine("<p class=\"meta\">Finding correlation method: " + EscapeHtml(metadata.PrimaryCorrelationMethod) + "</p>");
            sb.AppendLine("<p class=\"meta\">Finding dedupe key format: " + EscapeHtml(ComparisonFindingCorrelationMetadata.DedupeKeyFormat) + "</p>");
            sb.AppendLine("<p class=\"meta\">Policy-rule matches: " + metadata.PolicyRuleMatchCount + "</p>");
            sb.AppendLine("<p class=\"meta\">Fuzzy (possible) matches: " + metadata.FuzzyMatchCount + "</p>");
            sb.AppendLine("<p class=\"meta\">Correlation honesty: " + EscapeHtml(metadata.HonestyNote) + "</p>");
        }

        if (report.FindingLifecycle is not null)
            foreach (string line in CrossReviewFindingLifecycleExportLines.Build(report.FindingLifecycle))
                sb.AppendLine("<p class=\"meta\">" + EscapeHtml(line) + "</p>");

        sb.AppendLine("<hr/>");
        string summaryMarkdown = summaryFormatter.FormatMarkdown(report).Trim();
        string summaryHtml = MarkdownToSimpleHtml(summaryMarkdown);
        sb.AppendLine(summaryHtml);
        sb.AppendLine();

        if (!EndToEndComparisonExportProfile.IsShort(p))
        {
            sb.AppendLine("<hr/>");

            if (EndToEndComparisonExportProfile.IsExecutive(p))
                AppendSponsorReport(sb, report);
            else
            {
                AppendRunMetadataDiff(sb, report);
                AppendAgentResultDiff(sb, report);
                AppendManifestDiff(sb, report);
                AppendExportDiffs(sb, report);
            }

            if (!summaryMarkdown.Contains("## Interpretation Notes", StringComparison.Ordinal))
                AppendList(sb, "Interpretation Notes", report.InterpretationNotes);

            if (!summaryMarkdown.Contains("## Warnings", StringComparison.Ordinal))
                AppendList(sb, "Warnings", report.Warnings);
        }

        sb.AppendLine("</body></html>");
        return sb.ToString();
    }

    private static string EscapeHtml(string text)
    {
        return WebUtility.HtmlEncode(text);
    }

    private static string MarkdownToSimpleHtml(string markdown)
    {
        if (string.IsNullOrEmpty(markdown))
            return "";
        StringBuilder sb = new();
        foreach (string line in markdown.Split('\n'))
        {
            string t = line.TrimEnd();
            if (t.StartsWith("## "))
                sb.AppendLine("<h2>" + EscapeHtml(t[3..]) + "</h2>");
            else if (t.StartsWith("# "))
                sb.AppendLine("<h1>" + EscapeHtml(t[2..]) + "</h1>");
            else if (t.StartsWith("- "))
                sb.AppendLine("<li>" + EscapeHtml(t[2..]) + "</li>");
            else if (t.Length > 0)
                sb.AppendLine("<p>" + EscapeHtml(t) + "</p>");
            else
                sb.AppendLine("<br/>");
        }

        return sb.ToString();
    }

    private static void AppendSponsorReport(StringBuilder sb, EndToEndReplayComparisonReport report)
    {
        sb.AppendLine("<h2>Key counts</h2><ul>");
        sb.AppendLine("<li>Run metadata: " + report.RunDiff.ChangedFields.Count + " changed field(s); Request IDs differ: " +
                      (report.RunDiff.RequestIdsDiffer ? "Yes" : "No") + "</li>");
        if (report.AgentResultDiff is not null)
        {
            int withChanges = report.AgentResultDiff.AgentDeltas.Count(d =>
                d.AddedClaims.Count > 0 || d.RemovedClaims.Count > 0 || d.AddedFindings.Count > 0 || d.RemovedFindings.Count > 0 ||
                d.AddedRequiredControls.Count > 0 || d.RemovedRequiredControls.Count > 0 || d.AddedWarnings.Count > 0 || d.RemovedWarnings.Count > 0);
            sb.AppendLine("<li>Agent deltas: " + withChanges + " agent(s) with material changes</li>");
        }

        if (report.ManifestDiff is not null)
            sb.AppendLine("<li>Manifest: +" + report.ManifestDiff.AddedServices.Count + " / -" + report.ManifestDiff.RemovedServices.Count + " services; +" +
                          report.ManifestDiff.AddedDatastores.Count + " / -" + report.ManifestDiff.RemovedDatastores.Count + " datastores</li>");
        sb.AppendLine("<li>Export diffs: " + report.ExportDiffs.Count + "</li></ul>");
    }

    private static void AppendRunMetadataDiff(StringBuilder sb, EndToEndReplayComparisonReport report)
    {
        sb.AppendLine("<h2>Run Metadata Diff</h2><ul>");
        sb.AppendLine("<li>Request IDs Differ: " + (report.RunDiff.RequestIdsDiffer ? "Yes" : "No") + "</li>");
        sb.AppendLine("<li>Manifest Versions Differ: " + (report.RunDiff.ManifestVersionsDiffer ? "Yes" : "No") + "</li>");
        sb.AppendLine("<li>Status Differs: " + (report.RunDiff.StatusDiffers ? "Yes" : "No") + "</li>");
        sb.AppendLine("<li>Completion State Differs: " + (report.RunDiff.CompletionStateDiffers ? "Yes" : "No") + "</li>");
        foreach (string f in report.RunDiff.ChangedFields)
            sb.AppendLine("<li>Changed field: " + EscapeHtml(f) + "</li>");
        sb.AppendLine("</ul>");
    }

    private static void AppendAgentResultDiff(StringBuilder sb, EndToEndReplayComparisonReport report)
    {
        if (report.AgentResultDiff is null)
            return;
        sb.AppendLine("<h2>Agent Result Diff</h2>");
        foreach (AgentResultDelta delta in report.AgentResultDiff.AgentDeltas.OrderBy(x => x.AgentType))
        {
            sb.AppendLine("<h3>" + EscapeHtml(delta.AgentType.ToString()) + "</h3><ul>");
            sb.AppendLine("<li>Left Exists: " + (delta.LeftExists ? "Yes" : "No") + "</li>");
            sb.AppendLine("<li>Right Exists: " + (delta.RightExists ? "Yes" : "No") + "</li>");
            sb.AppendLine("<li>Left Confidence: " + (delta.LeftConfidence.HasValue ? delta.LeftConfidence.Value.ToString("0.00") : "n/a") + "</li>");
            sb.AppendLine("<li>Right Confidence: " + (delta.RightConfidence.HasValue ? delta.RightConfidence.Value.ToString("0.00") : "n/a") + "</li>");
            foreach (string c in delta.AddedClaims)
                sb.AppendLine("<li>Added claim: " + EscapeHtml(c) + "</li>");
            foreach (string c in delta.RemovedClaims)
                sb.AppendLine("<li>Removed claim: " + EscapeHtml(c) + "</li>");
            foreach (string f in delta.AddedFindings)
                sb.AppendLine("<li>Added finding: " + EscapeHtml(f) + "</li>");
            foreach (string f in delta.RemovedFindings)
                sb.AppendLine("<li>Removed finding: " + EscapeHtml(f) + "</li>");
            foreach (string c in delta.AddedRequiredControls)
                sb.AppendLine("<li>Added required control: " + EscapeHtml(c) + "</li>");
            foreach (string c in delta.RemovedRequiredControls)
                sb.AppendLine("<li>Removed required control: " + EscapeHtml(c) + "</li>");
            foreach (string w in delta.AddedWarnings)
                sb.AppendLine("<li>Added warning: " + EscapeHtml(w) + "</li>");
            foreach (string w in delta.RemovedWarnings)
                sb.AppendLine("<li>Removed warning: " + EscapeHtml(w) + "</li>");
            sb.AppendLine("</ul>");
        }
    }

    private static void AppendManifestDiff(StringBuilder sb, EndToEndReplayComparisonReport report)
    {
        if (report.ManifestDiff is null)
            return;
        sb.AppendLine("<h2>Manifest Diff</h2><ul>");
        foreach (string s in report.ManifestDiff.AddedServices)
            sb.AppendLine("<li>Added service: " + EscapeHtml(s) + "</li>");
        foreach (string s in report.ManifestDiff.RemovedServices)
            sb.AppendLine("<li>Removed service: " + EscapeHtml(s) + "</li>");
        foreach (string d in report.ManifestDiff.AddedDatastores)
            sb.AppendLine("<li>Added datastore: " + EscapeHtml(d) + "</li>");
        foreach (string d in report.ManifestDiff.RemovedDatastores)
            sb.AppendLine("<li>Removed datastore: " + EscapeHtml(d) + "</li>");
        foreach (string c in report.ManifestDiff.AddedRequiredControls)
            sb.AppendLine("<li>Added required control: " + EscapeHtml(c) + "</li>");
        foreach (string c in report.ManifestDiff.RemovedRequiredControls)
            sb.AppendLine("<li>Removed required control: " + EscapeHtml(c) + "</li>");
        foreach (RelationshipDiffItem rel in report.ManifestDiff.AddedRelationships)
            sb.AppendLine("<li>Added relationship: " + EscapeHtml(rel.ToDisplayLine()) + "</li>");
        foreach (RelationshipDiffItem rel in report.ManifestDiff.RemovedRelationships)
            sb.AppendLine("<li>Removed relationship: " + EscapeHtml(rel.ToDisplayLine()) + "</li>");
        sb.AppendLine("</ul>");
    }

    private static void AppendExportDiffs(StringBuilder sb, EndToEndReplayComparisonReport report)
    {
        if (report.ExportDiffs.Count == 0)
            return;
        sb.AppendLine("<h2>Export Diffs</h2>");
        foreach (ExportRecordDiffResult diff in report.ExportDiffs)
        {
            sb.AppendLine("<h3>" + EscapeHtml(diff.LeftExportRecordId + " -> " + diff.RightExportRecordId) + "</h3><ul>");
            foreach (string f in diff.ChangedTopLevelFields)
                sb.AppendLine("<li>Changed top-level field: " + EscapeHtml(f) + "</li>");
            foreach (string f in diff.RequestDiff.ChangedFlags)
                sb.AppendLine("<li>Changed request flag: " + EscapeHtml(f) + "</li>");
            foreach (string v in diff.RequestDiff.ChangedValues)
                sb.AppendLine("<li>Changed request value: " + EscapeHtml(v) + "</li>");
            foreach (string w in diff.Warnings)
                sb.AppendLine("<li>Warning: " + EscapeHtml(w) + "</li>");
            sb.AppendLine("</ul>");
        }
    }

    private static void AppendList(StringBuilder sb, string title, IReadOnlyCollection<string> items)
    {
        sb.AppendLine("<h2>" + EscapeHtml(title) + "</h2><ul>");
        if (items.Count == 0)
            sb.AppendLine("<li>None</li>");
        else
            foreach (string item in items)
                sb.AppendLine("<li>" + EscapeHtml(item) + "</li>");
        sb.AppendLine("</ul>");
    }
}
