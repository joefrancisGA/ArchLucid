using ArchLucid.Application.Rendering;
using ArchLucid.Contracts.Exports;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public sealed partial class ArchitectureReviewPdfBuilder
{
    private static void ComposeCoverPage(
        PageDescriptor page,
        ArchitectureReviewBoardExportDocumentModel model,
        WhitelabelConfiguration? whitelabel,
        byte[]? logoImageBytes,
        string footerText,
        string? activeTrialExportNotice,
        DateTimeOffset exportTimestampUtc)
    {
        page.Size(PageSizes.A4);
        page.Margin(2, Unit.Centimetre);
        page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Helvetica"));

        page.Footer().AlignCenter().Text(footerText).FontSize(8).FontColor(Colors.Grey.Darken1);

        if (!string.IsNullOrWhiteSpace(activeTrialExportNotice))
        {
            page.Background()
                .AlignCenter()
                .AlignMiddle()
                .Text(activeTrialExportNotice)
                .FontSize(36)
                .FontColor(Colors.Grey.Lighten3)
                .Italic();
        }

        if (model.IsDemoTenant)
        {
            page.Background()
                .AlignCenter()
                .AlignMiddle()
                .Text(DemoTenantExportWatermark)
                .FontSize(28)
                .FontColor(Colors.Grey.Lighten3)
                .Italic();
        }

        page.Content().AlignCenter().Column(column =>
        {
            ArchitectureReviewBoardCoverPageContent cover = ArchitectureReviewBoardCoverPageContent.Resolve(
                model,
                whitelabel,
                exportTimestampUtc,
                activeTrialExportNotice);

            if (logoImageBytes is { Length: > 0 })
            {
                column.Item()
                    .MaxWidth(ArchitectureReviewBoardCoverPageContent.PdfLogoMaxWidthPoints)
                    .Image(Image.FromBinaryData(logoImageBytes))
                    .FitArea();
                column.Item().Height(16);
            }
            else
            {
                column.Item()
                    .Text(ArchitectureReviewBoardCoverPageContent.LogoPlaceholderLabel)
                    .FontSize(9)
                    .FontColor(Colors.Grey.Darken2)
                    .Italic();
                column.Item().Height(16);
            }

            column.Item().Text(cover.Title).Bold().FontSize(22);
            column.Item().Height(8);

            if (!string.IsNullOrWhiteSpace(cover.Subtitle))
            {
                column.Item().Text(cover.Subtitle).SemiBold().FontSize(14);
                column.Item().Height(8);
            }

            if (!string.IsNullOrWhiteSpace(cover.PreparedForTenantName))
            {
                column.Item().Text($"Prepared for {cover.PreparedForTenantName}").FontSize(11);
                column.Item().Height(12);
            }

            column.Item().Text(cover.GeneratedOnLabel).FontSize(10).FontColor(Colors.Grey.Darken2);
            column.Item().Height(6);
            column.Item()
                .Text(ArchitectureReviewBoardCoverPageContent.DirectionalEstimatesFooter)
                .FontSize(8)
                .FontColor(Colors.Grey.Darken2)
                .Italic();

            if (!string.IsNullOrWhiteSpace(cover.DemoNotice))
            {
                column.Item().Height(8);
                column.Item()
                    .Text(cover.DemoNotice)
                    .FontSize(8)
                    .FontColor(Colors.Grey.Darken2)
                    .Italic();
            }

            column.Item().Height(22);

            column.Item().Text($"Review ID: {model.ReviewId:D}").FontSize(8).FontColor(Colors.Grey.Darken2);

            column.Item().Text($"Review (run) ID: {model.RunId.Trim()}").FontSize(8).FontColor(Colors.Grey.Darken2);

            if (!string.IsNullOrWhiteSpace(model.RequestId))
                column.Item().Text($"Request ID: {model.RequestId.Trim()}").FontSize(8).FontColor(Colors.Grey.Darken2);

            if (!string.IsNullOrWhiteSpace(model.ManifestVersion))
                column.Item().Text($"Architecture snapshot version: {model.ManifestVersion.Trim()}").FontSize(8)
                    .FontColor(Colors.Grey.Darken2);

            column.Item().Height(36);

            column.Item()
                .Text(
                    "Terminology follows buyer-facing glossary: Review ↔ committed run; Architecture snapshot ↔ golden manifest.")
                .FontSize(8)
                .FontColor(Colors.Grey.Darken2)
                .Italic();
        });
    }
}
