using System.Globalization;

using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Docx.Builders;
using ArchLucid.ArtifactSynthesis.FindingVerification.Models;
using ArchLucid.ArtifactSynthesis.Sanitization;

using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.ArtifactSynthesis.FindingVerification;

public static class FindingVerificationReportDocxRenderer
{
    public static byte[] Render(FindingVerificationReportDocumentModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        using MemoryStream stream = new();

        using (WordprocessingDocument document =
               WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document, true))
        {
            MainDocumentPart main = document.AddMainDocumentPart();
            main.Document = new Document();
            Body body = main.Document.AppendChild(new Body());

            WordDocumentBuilder.AddHeading(body, "Finding verification report");
            WordDocumentBuilder.AddBodyText(
                body,
                "Linked to the sealed architecture package; does not mutate ManifestHash.");
            WordDocumentBuilder.AddSpacer(body);

            WordDocumentBuilder.AddHeading(body, "Package reference", DocxStyleIds.Heading2);
            WordDocumentBuilder.AddSimpleTable(
                body,
                [
                    ("Run ID", model.RunId.ToString("D")),
                    ("Report ID", model.ReportId.ToString("D")),
                    ("Source manifest hash", SanitizeFindingCell(model.SourceManifestHash, "Source manifest hash")),
                    ("Report hash", SanitizeFindingCell(model.ReportHash, "Report hash")),
                    ("Created (UTC)", model.CreatedUtc.ToString("O", CultureInfo.InvariantCulture)),
                    (
                        "Verification findings snapshot",
                        model.VerificationFindingsSnapshotId?.ToString("D") ?? "Findings snapshot id was not stored."),
                ]);

            WordDocumentBuilder.AddSpacer(body);
            WordDocumentBuilder.AddHeading(body, "Confirmed findings summary", DocxStyleIds.Heading2);
            AppendSummary(body, model.Summary);
            WordDocumentBuilder.AddSpacer(body);

            WordDocumentBuilder.AddHeading(body, "Per-finding results", DocxStyleIds.Heading2);
            WordDocumentBuilder.AddFiveColumnTable(
                body,
                ("Finding ID", "Title", "Severity", "Status", "Trace"),
                model.Findings
                    .Select(finding => (
                        SanitizeFindingCell(finding.FindingId, "Finding id"),
                        SanitizeFindingCell(finding.Title, "Title"),
                        SanitizeFindingCell(finding.Severity, "Severity"),
                        SanitizeFindingCell(finding.Status, "Status"),
                        SanitizeFindingCell(finding.TraceText, "Trace")))
                    .ToList());

            main.Document.Save();
        }

        return stream.ToArray();
    }

    private static string SanitizeFindingCell(string? text, string fieldLabel)
    {
        if (text is null)
        {
            return $"{fieldLabel} was not stored.";
        }

        string sanitized = LlmArtifactFreeTextSanitizer.Sanitize(text);

        if (sanitized.Length == 0 || string.IsNullOrWhiteSpace(sanitized))
        {
            return $"{fieldLabel} was stored empty.";
        }

        return sanitized;
    }

    private static void AppendSummary(Body body, Core.Findings.FindingVerificationReportConfirmedRateSummary summary)
    {
        WordDocumentBuilder.AddBulletList(
            body,
            [
                $"Total findings scored: {summary.TotalResults}",
                $"Materialized: {summary.MaterializedCount}",
                $"Mitigated: {summary.MitigatedCount}",
                $"Not observed: {summary.NotObservedCount}",
                $"Not verifiable: {summary.NotVerifiableCount}",
            ]);

        if (summary.ConfirmedRate is double rate)
        {
            WordDocumentBuilder.AddBodyText(
                body,
                $"Findings confirmed rate: {rate.ToString("P1", CultureInfo.InvariantCulture)} "
                + $"(basis: {summary.ConfirmedNumerator}/{summary.VerifiableDenominator} verifiable findings; "
                + "excludes Not verifiable from denominator)");
        }
        else
        {
            WordDocumentBuilder.AddBodyText(
                body,
                "Findings confirmed rate: not computed (no verifiable findings in this report)");
        }
    }
}
