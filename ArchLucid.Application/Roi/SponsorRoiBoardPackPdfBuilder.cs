using ArchLucid.Application.Rendering;
using ArchLucid.Application.Roi;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Pilots;

/// <summary>Deterministic Markdown → PDF for sponsor ROI board packs (QuestPDF).</summary>
public sealed class SponsorRoiBoardPackPdfBuilder
{
    /// <summary>Renders board-pack Markdown to PDF bytes.</summary>
    public byte[] Build(string markdown)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(markdown);

        bool includesAdvisoryNarrative = markdown.Contains(
            SponsorRoiBoardPackNarrativeBuilder.AdvisoryNarrativeHeading,
            StringComparison.Ordinal);

        string footer = includesAdvisoryNarrative
            ? "Generated from Sponsor ROI summary. Advisory narrative is LLM-generated; sealed figures below are authoritative."
            : "Generated from Sponsor ROI summary — sealed structural metrics only.";

        return QuestPdfDocumentBytes.Generate(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));
                page.Header().Text("ArchLucid — Sponsor ROI Board Pack").Bold().FontSize(14);
                page.Content().Column(column => MarkdownPdfRenderer.Render(column, markdown));
                page.Footer().AlignCenter().Text(footer);
            });
        });
    }
}
