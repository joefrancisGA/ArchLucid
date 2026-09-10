using System.Globalization;

using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Docx.Builders;
using ArchLucid.ArtifactSynthesis.FindingVerification.Models;

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
                    ("Source manifest hash", model.SourceManifestHash),
                    ("Report hash", model.ReportHash),
                    ("Created (UTC)", model.CreatedUtc.ToString("O", CultureInfo.InvariantCulture)),
                    (
                        "Verification findings snapshot",
                        model.VerificationFindingsSnapshotId?.ToString("D") ?? "(none)"),
                ]);

            WordDocumentBuilder.AddSpacer(body);
            WordDocumentBuilder.AddHeading(body, "Confirmed findings summary", DocxStyleIds.Heading2);
            AppendSummary(body, model.Summary);
            WordDocumentBuilder.AddSpacer(body);

            WordDocumentBuilder.AddHeading(body, "Per-finding results", DocxStyleIds.Heading2);
            WordDocumentBuilder.AddFourColumnTable(
                body,
                ("Finding ID", "Title", "Status", "Trace"),
                model.Findings
                    .Select(finding => (
                        finding.FindingId,
                        finding.Title ?? string.Empty,
                        finding.Status,
                        finding.TraceText))
                    .ToList());

            main.Document.Save();
        }

        return stream.ToArray();
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
