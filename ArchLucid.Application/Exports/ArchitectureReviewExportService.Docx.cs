using System.Globalization;
using System.Text;

using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Exports;

namespace ArchLucid.Application.Exports;

public sealed partial class ArchitectureReviewExportService
{
    private async Task<ExportResult> BuildDocxExportAsync(
        ArchitectureReviewBoardExportDocumentModel documentModel,
        WhitelabelConfiguration? whitelabel,
        byte[]? resolvedLogoBytes,
        string? activeTrialExportNotice,
        string safeSegment,
        CancellationToken cancellationToken)
    {
        byte[] bytes = await docxBuilder.BuildAsync(
            documentModel,
            whitelabel,
            resolvedLogoBytes,
            activeTrialExportNotice,
            cancellationToken);

        MemoryStream stream = new(bytes);

        return new ExportResult(stream, "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            $"architecture-review-board-{safeSegment}.docx");
    }

    private static ExportResult BuildHtmlExport(
        ArchitectureReviewBoardExportDocumentModel documentModel,
        string? activeTrialExportNotice,
        string safeSegment)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(BuildMinimalHtml(documentModel, activeTrialExportNotice));
        MemoryStream stream = new(bytes);

        return new ExportResult(stream, "text/html; charset=utf-8", $"architecture-review-board-{safeSegment}.html");
    }

    private static string BuildMinimalHtml(ArchitectureReviewBoardExportDocumentModel documentModel, string? activeTrialExportNotice)
    {
        ArgumentNullException.ThrowIfNull(documentModel);

        string title = string.IsNullOrWhiteSpace(documentModel.SystemName)
            ? "Architecture review"
            : documentModel.SystemName.Trim();
        string summary = string.IsNullOrWhiteSpace(documentModel.SponsorReport)
            ? "No Sponsor report is available for this review."
            : documentModel.SponsorReport.Trim();

        StringBuilder html = new();
        html.AppendLine("<!DOCTYPE html>");
        html.AppendLine("<html lang=\"en\">");
        html.AppendLine("<head>");
        html.AppendLine("<meta charset=\"utf-8\" />");
        html.AppendLine(CultureInfo.InvariantCulture, $"<title>{HtmlEncode(title)}</title>");
        html.AppendLine("</head>");
        html.AppendLine("<body>");
        html.AppendLine(CultureInfo.InvariantCulture, $"<h1>{HtmlEncode(title)}</h1>");
        html.AppendLine(CultureInfo.InvariantCulture, $"<p><strong>Run:</strong> {HtmlEncode(documentModel.RunId)}</p>");

        if (documentModel.IsDemoTenant)
        {
            html.AppendLine(
                CultureInfo.InvariantCulture,
                $"<p><strong>Demo notice:</strong> {HtmlEncode(ArchitectureReviewBoardCoverPageContent.DemoTenantNotice)}</p>");
        }

        if (!string.IsNullOrWhiteSpace(activeTrialExportNotice))
        {
            html.AppendLine(
                CultureInfo.InvariantCulture,
                $"<p><strong>Trial notice:</strong> {HtmlEncode(activeTrialExportNotice)}</p>");
        }

        if (!string.IsNullOrWhiteSpace(documentModel.SimulatorRehearsalTitle))
        {
            html.AppendLine(
                CultureInfo.InvariantCulture,
                $"<p><strong>Simulator notice:</strong> {HtmlEncode(documentModel.SimulatorRehearsalTitle.Trim())}</p>");

            if (!string.IsNullOrWhiteSpace(documentModel.SimulatorRehearsalBody))
            {
                html.AppendLine(
                    CultureInfo.InvariantCulture,
                    $"<p>{HtmlEncode(documentModel.SimulatorRehearsalBody.Trim())}</p>");
            }
        }

        if (!string.IsNullOrWhiteSpace(documentModel.ExplanationConfidenceCallout))
        {
            html.AppendLine(
                CultureInfo.InvariantCulture,
                $"<p><em>{HtmlEncode(documentModel.ExplanationConfidenceCallout)}</em></p>");
        }

        if (!string.IsNullOrWhiteSpace(documentModel.ManifestVersion))
        {
            html.AppendLine(
                CultureInfo.InvariantCulture,
                $"<p><strong>Manifest version:</strong> {HtmlEncode(documentModel.ManifestVersion)}</p>");
        }

        html.AppendLine("<h2>Summary</h2>");
        html.AppendLine(CultureInfo.InvariantCulture, $"<p>{HtmlEncode(summary)}</p>");
        html.AppendLine("</body>");
        html.AppendLine("</html>");

        return html.ToString();
    }

    private static string HtmlEncode(string value)
    {
        return System.Net.WebUtility.HtmlEncode(value);
    }
}
