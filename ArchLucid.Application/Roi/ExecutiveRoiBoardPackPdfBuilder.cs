using ArchLucid.Application.Rendering;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Pilots;

/// <summary>Deterministic Markdown → PDF for executive ROI board packs (QuestPDF).</summary>
public sealed class ExecutiveRoiBoardPackPdfBuilder
{
    /// <summary>Renders board-pack Markdown to PDF bytes.</summary>
    public byte[] Build(string markdown)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(markdown);

        return QuestPdfDocumentBytes.Generate(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));
                page.Header().Text("ArchLucid — Executive ROI Board Pack").Bold().FontSize(14);
                page.Content().Column(column => MarkdownPdfRenderer.Render(column, markdown));
                page.Footer().AlignCenter().Text("Generated from Executive ROI summary — no LLM on this path.");
            });
        });
    }
}
