using ArchLucid.ContextIngestion.Contracts;
using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Parsing;

/// <summary>
///     Parses base64-encoded Visio <c>.vsdx</c> packages into structured-diagram canonical objects (AS-010).
/// </summary>
public sealed class VsdxContextDocumentParser : IContextDocumentParser
{
    private readonly VsdxDiagramSourceParser diagramParser = new();

    public bool CanParse(string contentType)
    {
        return SupportedContextDocumentContentTypes.IsVisioVsdxContentType(contentType);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        ContextDocumentReference document,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(document);
        _ = ct;

        DiagramParseResult parseResult = this.diagramParser.Parse(new DiagramSourceReference
        {
            Name = document.Name,
            Format = DiagramSourceFormats.Vsdx,
            Content = document.Content,
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
