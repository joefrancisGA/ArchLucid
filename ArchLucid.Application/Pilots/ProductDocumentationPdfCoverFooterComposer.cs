using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Shared cover page and running footer for static product-documentation PDFs (TB-724).
/// </summary>
internal static class ProductDocumentationPdfCoverFooterComposer
{
    internal const string CopyrightFooterLine =
        "© 2026 Francis Software LLC d/b/a ArchLucid. All rights reserved.";

    internal const float LogoMaxWidthPoints = 180f;

    internal static void ComposeCoverPage(
        PageDescriptor page,
        ProductDocumentationPdfRenderMetadata metadata,
        byte[]? logoImageBytes)
    {
        page.Size(PageSizes.A4);
        page.Margin(2, Unit.Centimetre);
        page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));

        page.Footer().Element(ComposeRunningFooter);

        page.Content().AlignMiddle().Column(column =>
        {
            if (logoImageBytes is { Length: > 0 })
            {
                column.Item()
                    .AlignCenter()
                    .MaxWidth(LogoMaxWidthPoints)
                    .Image(Image.FromBinaryData(logoImageBytes))
                    .FitArea();
                column.Item().Height(20);
            }

            column.Item().AlignCenter().Text(metadata.Title.Trim()).Bold().FontSize(22);
            column.Item().Height(16);

            if (!string.IsNullOrWhiteSpace(metadata.VersionDateLabel))
            {
                column.Item()
                    .AlignCenter()
                    .Text($"Version date: {metadata.VersionDateLabel.Trim()}")
                    .FontSize(11)
                    .FontColor(Colors.Grey.Darken2);
                column.Item().Height(8);
            }

            if (!string.IsNullOrWhiteSpace(metadata.AudienceLabel))
            {
                column.Item()
                    .AlignCenter()
                    .Text($"Audience: {metadata.AudienceLabel.Trim()}")
                    .FontSize(11)
                    .FontColor(Colors.Grey.Darken2);
                column.Item().Height(12);
            }

            if (!string.IsNullOrWhiteSpace(metadata.StatusLabel))
            {
                column.Item()
                    .AlignCenter()
                    .Border(1)
                    .BorderColor(Colors.Grey.Darken2)
                    .Background(Colors.Grey.Lighten4)
                    .PaddingHorizontal(12)
                    .PaddingVertical(4)
                    .Text(metadata.StatusLabel.Trim())
                    .SemiBold()
                    .FontSize(10)
                    .FontColor(Colors.Grey.Darken3);
            }
        });
    }

    internal static void ComposeBodyPage(PageDescriptor page, string markdown)
    {
        page.Size(PageSizes.A4);
        page.Margin(2, Unit.Centimetre);
        page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));

        page.Footer().Element(ComposeRunningFooter);

        page.Content().Column(column => MarkdownPdfRenderer.Render(column, markdown));
    }

    private static void ComposeRunningFooter(IContainer container)
    {
        container.AlignCenter().Text(text =>
        {
            text.DefaultTextStyle(x => x.FontSize(8).FontColor(Colors.Grey.Darken1));
            text.Span(CopyrightFooterLine);
            text.Span("  ·  Page ");
            text.CurrentPageNumber();
            text.Span(" of ");
            text.TotalPages();
        });
    }
}
