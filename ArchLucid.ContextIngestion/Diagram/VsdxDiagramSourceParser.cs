using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

public sealed class VsdxDiagramSourceParser : IDiagramSourceParser
{
    private readonly ArchitectureDiagramServiceTypeInferencer inferencer = new();

    public bool CanParse(string format)
    {
        return string.Equals(format, DiagramSourceFormats.Vsdx, StringComparison.OrdinalIgnoreCase);
    }

    public DiagramParseResult Parse(DiagramSourceReference source)
    {
        ArgumentNullException.ThrowIfNull(source);

        ArchitectureDiagramModelRecord model = new();
        List<string> warnings = [];

        if (!VsdxPackageReader.TryDecodePackageContent(source.Content, out byte[] packageBytes, warnings))
        {
            return new DiagramParseResult { Model = model, Warnings = warnings };
        }

        VsdxPackageReadResult packageResult = VsdxPackageReader.Read(packageBytes);
        warnings.AddRange(packageResult.Warnings);

        Dictionary<string, ArchitectureDiagramNodeRecord> nodes = new(StringComparer.Ordinal);
        int edgeIndex = 0;

        foreach (string pageXml in packageResult.PageXmlDocuments)
        {
            try
            {
                VsdxPageXmlDiagramParser.ParseIntoModel(
                    pageXml,
                    model,
                    nodes,
                    this.inferencer,
                    ref edgeIndex);
            }
            catch (Exception ex)
            {
                warnings.Add($"Visio page XML parse failed: {ex.Message}");
            }
        }

        model.Nodes.AddRange(nodes.Values.OrderBy(node => node.Id, StringComparer.Ordinal));

        if (model.Nodes.Count == 0)
        {
            warnings.Add("No Visio shapes with labels were recognized in the package.");
        }

        return new DiagramParseResult
        {
            Model = model,
            Warnings = warnings,
            LabelOnlyInferenceConfidence = model.Nodes.Count > 0 ? this.inferencer.LabelOnlyConfidence : null,
        };
    }
}
