using ArchLucid.ContextIngestion.Contracts;
using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Parsing;

/// <summary>
///     Parses draw.io XML context documents into structured-diagram canonical objects (AS-009).
/// </summary>
public sealed class DrawIoContextDocumentParser : IContextDocumentParser
{
    private readonly DrawIoXmlDiagramSourceParser diagramParser = new();

    public bool CanParse(string contentType)
    {
        return SupportedContextDocumentContentTypes.IsDrawIoXmlContentType(contentType);
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
            Format = DiagramSourceFormats.DrawIoXml,
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
