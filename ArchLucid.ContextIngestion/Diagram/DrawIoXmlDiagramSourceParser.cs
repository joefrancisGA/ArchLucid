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

        DrawIoXmlPayloadExpandResult expandResult = DrawIoXmlPayloadExpander.Expand(source.Content);
        warnings.AddRange(expandResult.Warnings);

        if (string.IsNullOrWhiteSpace(expandResult.XmlPayload))
        {
            return new DiagramParseResult { Model = model, Warnings = warnings };
        }

        try
        {
            XDocument document = XDocument.Parse(expandResult.XmlPayload, LoadOptions.None);
            IEnumerable<XElement> cells = document.Descendants()
                .Where(element => string.Equals(element.Name.LocalName, "mxCell", StringComparison.Ordinal));

            Dictionary<string, ArchitectureDiagramNodeRecord> nodes = new(StringComparer.Ordinal);
            int edgeIndex = 0;

            foreach (XElement cell in cells)
            {
                string? cellId = cell.Attribute("id")?.Value;
                string? value = cell.Attribute("value")?.Value;
                string? edge = cell.Attribute("edge")?.Value;
                string? vertex = cell.Attribute("vertex")?.Value;
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

                if (string.Equals(vertex, "1", StringComparison.Ordinal) && !string.IsNullOrWhiteSpace(value))
                {
                    EnsureNode(nodes, cellId, value);
                }
            }

            model.Nodes.AddRange(nodes.Values.OrderBy(node => node.Id, StringComparer.Ordinal));

            if (model.Nodes.Count == 0)
            {
                warnings.Add("No draw.io vertices were recognized in the source.");
            }
        }
        catch (Exception ex)
        {
            warnings.Add($"draw.io XML structured parse failed: {ex.Message}");
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
