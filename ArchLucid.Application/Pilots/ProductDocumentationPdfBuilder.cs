using ArchLucid.Application.Rendering;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     PDF projection of in-app product documentation markdown — same QuestPDF stack as
///     <see cref="ExecutiveSponsorBriefPdfBuilder" /> and <see cref="MarkdownPdfRenderer" />.
/// </summary>
public sealed class ProductDocumentationPdfBuilder
{
    /// <summary>Serializes prepared documentation markdown to PDF bytes.</summary>
    public byte[] Build(string markdown, ProductDocumentationPdfRenderMetadata metadata)
    {
        ArgumentNullException.ThrowIfNull(markdown);
        ArgumentNullException.ThrowIfNull(metadata);

        if (string.IsNullOrWhiteSpace(metadata.Title))
            throw new ArgumentException("Title is required.", nameof(metadata));

        return QuestPdfDocumentBytes.Generate(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));

                page.Header().Column(header =>
                {
                    header.Item().Text($"ArchLucid — {metadata.Title.Trim()}").Bold().FontSize(14);

                    string subtitle = BuildSubtitle(metadata);

                    if (subtitle.Length > 0)
                        header.Item().PaddingTop(4).Text(subtitle).FontSize(9).FontColor(Colors.Grey.Darken2);
                });

                page.Content().Column(column => MarkdownPdfRenderer.Render(column, markdown));

                page.Footer()
                    .AlignCenter()
                    .Text("ArchLucid product documentation — PDF is a portable rendering of the in-app help article.");
            });
        });
    }

    private static string BuildSubtitle(ProductDocumentationPdfRenderMetadata metadata)
    {
        List<string> parts = [];

        if (!string.IsNullOrWhiteSpace(metadata.VersionDateLabel))
            parts.Add($"Version date: {metadata.VersionDateLabel.Trim()}");

        if (!string.IsNullOrWhiteSpace(metadata.AudienceLabel))
            parts.Add($"Audience: {metadata.AudienceLabel.Trim()}");

        if (!string.IsNullOrWhiteSpace(metadata.StatusLabel))
            parts.Add($"Status: {metadata.StatusLabel.Trim()}");

        return string.Join(" · ", parts);
    }
}
