using System.Xml.Linq;

using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

public sealed class DrawIoXmlDiagramSourceParser : IDiagramSourceParser
{
    private readonly ArchitectureDiagramServiceTypeInferencer inferencer = new();

    public bool CanParse(string format)
    {
        return string.Equals(format, DiagramSourceFormats.DrawIoXml, StringComparison.OrdinalIgnoreCase);
    }

    public DiagramParseResult Parse(DiagramSourceReference source)
    {
        ArgumentNullException.ThrowIfNull(source);

        ArchitectureDiagramModelRecord model = new();
        List<string> warnings = [];

        if (string.IsNullOrWhiteSpace(source.Content))
        {
            warnings.Add("draw.io XML was empty.");

            return new DiagramParseResult { Model = model, Warnings = warnings };
        }

        try
        {
            XDocument document = XDocument.Parse(source.Content);
            IEnumerable<XElement> cells = document.Descendants()
                .Where(element => string.Equals(element.Name.LocalName, "mxCell", StringComparison.Ordinal));

            Dictionary<string, ArchitectureDiagramNodeRecord> nodes = new(StringComparer.Ordinal);
            int edgeIndex = 0;

            foreach (XElement cell in cells)
            {
                string? cellId = cell.Attribute("id")?.Value;
                string? parentId = cell.Attribute("parent")?.Value;
                string? value = cell.Attribute("value")?.Value;
                string? edge = cell.Attribute("edge")?.Value;
                string? edgeSource = cell.Attribute("source")?.Value;
                string? target = cell.Attribute("target")?.Value;

                if (string.IsNullOrWhiteSpace(cellId))
                {
                    continue;
                }

                if (string.Equals(edge, "1", StringComparison.Ordinal)
                    && !string.IsNullOrWhiteSpace(edgeSource)
                    && !string.IsNullOrWhiteSpace(target))
                {
                    EnsureNode(nodes, edgeSource, edgeSource);
                    EnsureNode(nodes, target, target);

                    model.Edges.Add(new ArchitectureDiagramEdgeRecord
                    {
                        Id = $"edge-{edgeIndex++}",
                        SourceId = edgeSource,
                        TargetId = target,
                        Label = value ?? string.Empty,
                        Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                    });

                    continue;
                }

                if (!string.IsNullOrWhiteSpace(value) && !string.Equals(parentId, "0", StringComparison.Ordinal))
                {
                    EnsureNode(nodes, cellId, value);
                }
            }

            model.Nodes.AddRange(nodes.Values.OrderBy(node => node.Id, StringComparer.Ordinal));
        }
        catch (Exception ex)
        {
            warnings.Add($"draw.io XML parse failed: {ex.Message}");
        }

        return new DiagramParseResult
        {
            Model = model,
            Warnings = warnings,
            LabelOnlyInferenceConfidence = model.Nodes.Count > 0 ? this.inferencer.LabelOnlyConfidence : null,
        };
    }

    private void EnsureNode(Dictionary<string, ArchitectureDiagramNodeRecord> nodes, string id, string label)
    {
        if (nodes.ContainsKey(id))
        {
            return;
        }

        ArchitectureDiagramNodeRecord node = new()
        {
            Id = id,
            Label = label,
        };

        this.inferencer.ApplyLabelInference(node);
        nodes[id] = node;
    }
}
