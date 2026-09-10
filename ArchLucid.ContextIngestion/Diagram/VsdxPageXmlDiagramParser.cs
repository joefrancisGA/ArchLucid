using System.Xml.Linq;

using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

/// <summary>
///     Maps Visio page XML shapes and connects into <see cref="ArchitectureDiagramModelRecord" /> (AS-010).
/// </summary>
internal static class VsdxPageXmlDiagramParser
{
    internal static void ParseIntoModel(
        string pageXml,
        ArchitectureDiagramModelRecord model,
        Dictionary<string, ArchitectureDiagramNodeRecord> nodes,
        ArchitectureDiagramServiceTypeInferencer inferencer,
        ref int edgeIndex)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(inferencer);

        XDocument document = VsdxPackageReader.ParsePageXml(pageXml);

        foreach (XElement shape in document.Descendants().Where(element =>
                     string.Equals(element.Name.LocalName, "Shape", StringComparison.OrdinalIgnoreCase)))
        {
            string? shapeId = shape.Attribute("ID")?.Value?.Trim();

            if (string.IsNullOrWhiteSpace(shapeId))
            {
                continue;
            }

            string? label = ReadShapeLabel(shape);

            if (string.IsNullOrWhiteSpace(label))
            {
                continue;
            }

            AddNode(nodes, inferencer, shapeId, label);
        }

        foreach (XElement connect in document.Descendants().Where(element =>
                     string.Equals(element.Name.LocalName, "Connect", StringComparison.OrdinalIgnoreCase)))
        {
            string? fromId = connect.Attribute("FromSheet")?.Value?.Trim();
            string? toId = connect.Attribute("ToSheet")?.Value?.Trim();

            if (string.IsNullOrWhiteSpace(fromId) || string.IsNullOrWhiteSpace(toId))
            {
                continue;
            }

            EnsurePlaceholderNode(nodes, inferencer, fromId);
            EnsurePlaceholderNode(nodes, inferencer, toId);

            model.Edges.Add(new ArchitectureDiagramEdgeRecord
            {
                Id = $"edge-{edgeIndex++}",
                SourceId = fromId,
                TargetId = toId,
                Label = string.Empty,
                Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
            });
        }
    }

    private static void AddNode(
        Dictionary<string, ArchitectureDiagramNodeRecord> nodes,
        ArchitectureDiagramServiceTypeInferencer inferencer,
        string shapeId,
        string label)
    {
        if (nodes.ContainsKey(shapeId))
        {
            return;
        }

        ArchitectureDiagramNodeRecord node = new()
        {
            Id = shapeId,
            Label = label,
        };

        inferencer.ApplyLabelInference(node);
        nodes[shapeId] = node;
    }

    private static void EnsurePlaceholderNode(
        Dictionary<string, ArchitectureDiagramNodeRecord> nodes,
        ArchitectureDiagramServiceTypeInferencer inferencer,
        string shapeId)
    {
        if (nodes.ContainsKey(shapeId))
        {
            return;
        }

        ArchitectureDiagramNodeRecord node = new()
        {
            Id = shapeId,
            Label = shapeId,
        };

        inferencer.ApplyLabelInference(node);
        nodes[shapeId] = node;
    }

    private static string? ReadShapeLabel(XElement shape)
    {
        string? nameU = shape.Attribute("NameU")?.Value?.Trim();

        if (!string.IsNullOrWhiteSpace(nameU))
        {
            return nameU;
        }

        XElement? textElement = shape.Descendants()
            .FirstOrDefault(element => string.Equals(element.Name.LocalName, "Text", StringComparison.OrdinalIgnoreCase));

        string? textValue = textElement?.Value?.Trim();

        if (!string.IsNullOrWhiteSpace(textValue))
        {
            return textValue;
        }

        return shape.Attribute("Name")?.Value?.Trim();
    }
}
