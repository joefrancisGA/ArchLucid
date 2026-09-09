using ArchLucid.ContextIngestion.Contracts;
using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Parsing;

/// <summary>
///     Parses native <c>application/vnd.archlucid.diagram+json</c> context documents into structured-diagram
///     canonical objects (AS-012). Product-minted diagram ids keep asserted provenance for full inference confidence.
/// </summary>
public sealed class ArchLucidDiagramJsonContextDocumentParser : IContextDocumentParser
{
    private readonly ArchLucidDiagramJsonParser diagramParser = new();

    public bool CanParse(string contentType)
    {
        return SupportedContextDocumentContentTypes.IsStructuredDiagramJsonContentType(contentType);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        ContextDocumentReference document,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(document);
        _ = ct;

        string content = document.Content;

        if (content.Length > 0 && content[0] == '\uFEFF')
        {
            content = content[1..];
        }

        DiagramParseResult parseResult = this.diagramParser.Parse(new DiagramSourceReference
        {
            Name = document.Name,
            Format = DiagramSourceFormats.ArchLucidDiagramJson,
            Content = content,
        });

        ArchitectureDiagramModelRecord model = parseResult.Model;

        if (model.Nodes.Count == 0)
        {
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        model.ExtractionMethod = DiagramExtractionMethods.StructuredParse;
        ApplyProductMintedProvenance(model);

        IReadOnlyList<CanonicalObject> objects = ArchitectureDiagramCanonicalObjectMapper.Map(
            model,
            document.DocumentId,
            labelOnlyInferenceConfidence: 1d);

        return Task.FromResult(objects);
    }

    private static void ApplyProductMintedProvenance(ArchitectureDiagramModelRecord model)
    {
        foreach (ArchitectureDiagramNodeRecord node in model.Nodes)
        {
            if (node.Removed)
            {
                continue;
            }

            node.Provenance = ArchitectureDiagramProvenanceKinds.Asserted;
        }

        foreach (ArchitectureDiagramEdgeRecord edge in model.Edges)
        {
            if (edge.Removed)
            {
                continue;
            }

            edge.Provenance = ArchitectureDiagramProvenanceKinds.Asserted;
        }
    }
}
