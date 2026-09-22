using System.Globalization;
using System.Text;

using DocumentFormat.OpenXml.Wordprocessing;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

internal static class ArchitectureReviewBoardSendableExportCoverRenderer
{
    internal static void AppendHtml(StringBuilder html, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArgumentNullException.ThrowIfNull(html);
        ArgumentNullException.ThrowIfNull(model);

        if (string.IsNullOrWhiteSpace(model.SendableExportCoverPlainText))
        {
            return;
        }

        html.AppendLine("<h2>Sendable export cover</h2>");

        foreach (string line in SplitLines(model.SendableExportCoverPlainText))
        {
            html.AppendLine(CultureInfo.InvariantCulture, $"<p>{HtmlEncode(line)}</p>");
        }

        html.AppendLine(
            CultureInfo.InvariantCulture,
            $"<p><em>{HtmlEncode("Cover fields mirror the review-package stamp: policy pack, gate outcome, and execution mode before findings.")}</em></p>");
    }

    internal static void AppendDocxCover(Body body, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArgumentNullException.ThrowIfNull(body);
        ArgumentNullException.ThrowIfNull(model);

        if (string.IsNullOrWhiteSpace(model.SendableExportCoverPlainText))
        {
            return;
        }

        ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 2);
        ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(body, "Sendable export cover", "DocSubtitle");

        foreach (string line in SplitLines(model.SendableExportCoverPlainText))
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(body, line, "BodyText");
        }

        ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(
            body,
            "Cover fields mirror the review-package stamp: policy pack, gate outcome, and execution mode before findings.",
            "Subtle");
    }

    internal static void AppendPdfCover(ColumnDescriptor column, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        if (string.IsNullOrWhiteSpace(model.SendableExportCoverPlainText))
        {
            return;
        }

        column.Item().Height(12);
        column.Item().Text("Sendable export cover").SemiBold().FontSize(12);

        foreach (string line in SplitLines(model.SendableExportCoverPlainText))
        {
            column.Item().Text(line).FontSize(9).FontColor(Colors.Grey.Darken2);
        }

        column.Item()
            .PaddingTop(4)
            .Text("Cover fields mirror the review-package stamp: policy pack, gate outcome, and execution mode before findings.")
            .FontSize(8)
            .FontColor(Colors.Grey.Darken2)
            .Italic();
    }

    private static IEnumerable<string> SplitLines(string plainText) =>
        plainText
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    private static string HtmlEncode(string value) => System.Net.WebUtility.HtmlEncode(value);
}
