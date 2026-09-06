using ArchLucid.Contracts.Exports;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public sealed partial class ArchitectureReviewPdfBuilder
{
    private static void ComposeDocumentBody(PageDescriptor page, ArchitectureReviewBoardExportDocumentModel model, string footerText)
    {
        page.Size(PageSizes.A4);
        page.Margin(2, Unit.Centimetre);
        page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Helvetica"));

        page.Footer().AlignCenter().Text(footerText).FontSize(8).FontColor(Colors.Grey.Darken1);

        page.Content().Column(column =>
        {
            AddCareerExportHonestySection(column, model);

            ArchitectureReviewBoardExportSectionVisitor.VisitBodySections((kind, firstMajorHeading) =>
                RenderPdfBodySection(column, kind, model, firstMajorHeading));
        });
    }

    private static void RenderPdfBodySection(
        ColumnDescriptor column,
        ArchitectureReviewBoardExportSectionKind kind,
        ArchitectureReviewBoardExportDocumentModel model,
        bool firstMajorHeading)
    {
        switch (kind)
        {
            case ArchitectureReviewBoardExportSectionKind.SponsorReport:
                AddSponsorReport(column, model, firstMajorHeading);
                break;
            case ArchitectureReviewBoardExportSectionKind.SystemOverview:
                AddSystemOverview(column, model, firstMajorHeading);
                break;
            case ArchitectureReviewBoardExportSectionKind.EvidenceReviewed:
                AddEvidenceReviewed(column, model, firstMajorHeading);
                break;
            case ArchitectureReviewBoardExportSectionKind.ArchitectureDecisions:
                AddArchitectureDecisions(column, model, firstMajorHeading);
                break;
            case ArchitectureReviewBoardExportSectionKind.KeyRisks:
                AddKeyRisks(column, model, firstMajorHeading);
                break;
            case ArchitectureReviewBoardExportSectionKind.PolicyFindings:
                AddPolicyFindings(column, model, firstMajorHeading);
                break;
            case ArchitectureReviewBoardExportSectionKind.AiAssistedAnalysis:
                AddAiAssistedAnalysis(column, model, firstMajorHeading);
                break;
            case ArchitectureReviewBoardExportSectionKind.TraceabilityAppendix:
                AddTraceabilityAppendix(column, model, firstMajorHeading);
                break;
            case ArchitectureReviewBoardExportSectionKind.RecommendedNextActions:
                AddRecommendedNextActions(column, model, firstMajorHeading);
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown export section kind.");
        }
    }

    private static void AddHeading(ColumnDescriptor column, string text, bool firstMajorHeading)
    {
        float paddingTop = firstMajorHeading ? 0f : 12f;

        column.Item().PaddingTop(paddingTop).Text(text).Bold().FontSize(16);
    }

    private static void AddPlaceholder(ColumnDescriptor column, string itemPhrase)
    {
        column.Item().PaddingVertical(2).Text($"No {itemPhrase} recorded.").FontSize(8).FontColor(Colors.Grey.Darken2).Italic();

        column.Item().Height(8);
    }

    private static void AddBullet(ColumnDescriptor column, string text)
    {
        column.Item().PaddingVertical(1).Row(row =>
        {
            row.ConstantItem(12).Text("•").FontSize(10);
            row.RelativeItem().Text(text).FontSize(9);
        });
    }

    private static void AddMultilineBodyText(ColumnDescriptor column, string text)
    {
        foreach (string line in text.Replace("\r\n", "\n").Split('\n'))
        {
            string trimmed = line.TrimEnd();

            if (string.IsNullOrEmpty(trimmed))
                column.Item().Height(6);
            else
                column.Item().PaddingVertical(1).Text(trimmed).FontSize(9);
        }

        column.Item().Height(8);
    }
}
