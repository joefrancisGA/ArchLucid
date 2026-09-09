using ArchLucid.ContextIngestion.Contracts;
using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Parsing;

/// <summary>
///     Parses sanitized SVG diagram source into structured-diagram canonical objects (AS-008).
/// </summary>
public sealed class SvgContextDocumentParser : IContextDocumentParser
{
    private readonly SvgDiagramSourceParser diagramParser = new();

    public bool CanParse(string contentType)
    {
        return SupportedContextDocumentContentTypes.IsStructuredDiagramSvgContentType(contentType);
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
            Format = DiagramSourceFormats.Svg,
            Content = content,
        });

        ArchitectureDiagramModelRecord model = parseResult.Model;
        model.ExtractionMethod = DiagramExtractionMethods.StructuredParse;

        double labelOnlyConfidence = parseResult.LabelOnlyInferenceConfidence
                                     ?? new ArchitectureDiagramServiceTypeInferencer().LabelOnlyConfidence;

        IReadOnlyList<CanonicalObject> objects = ArchitectureDiagramCanonicalObjectMapper.Map(
            model,
            document.DocumentId,
            labelOnlyConfidence);

        return Task.FromResult(objects);
    }
}
