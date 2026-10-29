using ArchLucid.Contracts.Exports;

using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public sealed partial class ArchitectureReviewPdfBuilder
{
    private static void AddCareerExportHonestySection(ColumnDescriptor column, ArchitectureReviewBoardExportDocumentModel model)
    {
        if (string.IsNullOrWhiteSpace(model.CareerExportHonestyPlainText))
        {
            return;
        }

        AddHeading(column, "Career export honesty", firstMajorHeading: true);
        AddMultilineBodyText(column, model.CareerExportHonestyPlainText.Trim());
    }

    private static void AddSponsorReport(
        ColumnDescriptor column,
        ArchitectureReviewBoardExportDocumentModel model,
        bool firstMajorHeading)
    {
        AddHeading(column, ArchitectureReviewBoardExportSectionCatalog.GetHeading(
            ArchitectureReviewBoardExportSectionKind.SponsorReport), firstMajorHeading);

        if (string.IsNullOrWhiteSpace(model.SponsorReport))
            AddStyledOmissionLine(column, ArchitectureReviewBoardExportHonestyCopy.SponsorReportNotStored);
        else
            AddMultilineBodyText(column, model.SponsorReport);
    }

    private static void AddSystemOverview(
        ColumnDescriptor column,
        ArchitectureReviewBoardExportDocumentModel model,
        bool firstMajorHeading)
    {
        AddHeading(column, ArchitectureReviewBoardExportSectionCatalog.GetHeading(
            ArchitectureReviewBoardExportSectionKind.SystemOverview), firstMajorHeading);

        IReadOnlyList<string> bullets = model.SystemOverviewBullets ?? [];

        if (bullets.Count == 0)
        {
            AddPlaceholder(column, "architecture snapshot overview items");

            return;
        }

        foreach (string line in bullets)
        {
            string bulletText = string.IsNullOrWhiteSpace(line)
                ? ArchitectureReviewBoardExportHonestyCopy.OverviewItemStoredEmpty
                : line.Trim();

            AddBullet(column, bulletText);
        }

        column.Item().Height(8);
    }
}
