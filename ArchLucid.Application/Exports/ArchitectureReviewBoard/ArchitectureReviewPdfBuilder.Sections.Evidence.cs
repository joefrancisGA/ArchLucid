using ArchLucid.Contracts.Exports;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public sealed partial class ArchitectureReviewPdfBuilder
{
    private static void AddEvidenceReviewed(
        ColumnDescriptor column,
        ArchitectureReviewBoardExportDocumentModel model,
        bool firstMajorHeading)
    {
        AddHeading(column, ArchitectureReviewBoardExportSectionCatalog.GetHeading(
            ArchitectureReviewBoardExportSectionKind.EvidenceReviewed), firstMajorHeading);

        IReadOnlyList<ArchitectureReviewBoardExportEvidenceItem> items = model.EvidenceReviewed ?? [];

        if (items.Count == 0)
        {
            AddPlaceholder(column, "evidence items");

            return;
        }

        foreach (ArchitectureReviewBoardExportEvidenceItem item in items)
        {
            string headline = string.IsNullOrWhiteSpace(item.Title) ? "Evidence title was not stored." : item.Title.Trim();

            column.Item().PaddingVertical(2).Text(headline).FontSize(9);

            string detailText = string.IsNullOrWhiteSpace(item.Detail)
                ? ArchitectureReviewBoardExportHonestyCopy.EvidenceDetailNotStored
                : item.Detail.Trim();
            column.Item().Text(detailText).FontSize(8).FontColor(Colors.Grey.Darken2);

            string referenceText = string.IsNullOrWhiteSpace(item.Reference)
                ? ArchitectureReviewBoardExportHonestyCopy.EvidenceReferenceNotStored
                : $"Reference: {item.Reference.Trim()}";
            column.Item().Text(referenceText).FontSize(8).FontColor(Colors.Grey.Darken2);

            column.Item().Height(6);
        }
    }

    private static void AddTraceabilityAppendix(
        ColumnDescriptor column,
        ArchitectureReviewBoardExportDocumentModel model,
        bool firstMajorHeading)
    {
        AddHeading(column, ArchitectureReviewBoardExportSectionCatalog.GetHeading(
            ArchitectureReviewBoardExportSectionKind.TraceabilityAppendix), firstMajorHeading);

        List<(string Key, string Value)> rows =
        [
            ("HTTP correlation ID", string.IsNullOrWhiteSpace(model.HttpCorrelationId)
                ? ArchitectureReviewBoardExportHonestyCopy.HttpCorrelationIdNotStored
                : model.HttpCorrelationId.Trim()),
            ("Architecture snapshot version", string.IsNullOrWhiteSpace(model.ManifestVersion)
                ? ArchitectureReviewBoardExportHonestyCopy.ManifestVersionNotStored
                : model.ManifestVersion.Trim()),
            ("Extractor timestamp (UTC)", string.IsNullOrWhiteSpace(model.ExtractorTimestampUtcLabel)
                ? ArchitectureReviewBoardExportHonestyCopy.ExtractorTimestampNotStored
                : model.ExtractorTimestampUtcLabel.Trim()),
        ];

        foreach (ArchitectureReviewBoardExportTraceRow line in model.TraceabilityLines ?? [])
        {
            if (string.IsNullOrWhiteSpace(line.Label))
                continue;

            rows.Add((line.Label.Trim(), string.IsNullOrWhiteSpace(line.Value) ? "Value was not stored" : line.Value.Trim()));
        }

        if (rows.Count == 0)
        {
            AddPlaceholder(column, "traceability references");

            return;
        }

        column.Item().PaddingVertical(4).Table(table =>
        {
            table.ColumnsDefinition(cols =>
            {
                cols.RelativeColumn(2);
                cols.RelativeColumn(3);
            });

            foreach ((string key, string value) in rows)
            {
                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(key).SemiBold();
                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(value);
            }
        });
    }
}
