using ArchLucid.Application.Rendering;

using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     PDF projection of in-app product documentation markdown — same QuestPDF stack as
///     <see cref="SponsorBriefPdfBuilder" /> and <see cref="MarkdownPdfRenderer" />.
/// </summary>
public sealed class ProductDocumentationPdfBuilder
{
    /// <summary>Serializes prepared documentation markdown to PDF bytes.</summary>
    public byte[] Build(
        string markdown,
        ProductDocumentationPdfRenderMetadata metadata,
        byte[]? logoImageBytes = null)
    {
        ArgumentNullException.ThrowIfNull(markdown);
        ArgumentNullException.ThrowIfNull(metadata);

        if (string.IsNullOrWhiteSpace(metadata.Title))
            throw new ArgumentException("Title is required.", nameof(metadata));

        return QuestPdfDocumentBytes.Generate(container =>
        {
            container.Page(page =>
                ProductDocumentationPdfCoverFooterComposer.ComposeCoverPage(page, metadata, logoImageBytes));

            container.Page(page => ProductDocumentationPdfCoverFooterComposer.ComposeBodyPage(page, markdown));
        });
    }
}
