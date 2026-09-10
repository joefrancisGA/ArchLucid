using System.Xml.Linq;

using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

public sealed class SvgDiagramSourceParser : IDiagramSourceParser
{
    private static readonly HashSet<string> ShapeElementNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "rect",
        "ellipse",
        "circle",
        "path",
        "line",
    };

    private readonly ArchitectureDiagramServiceTypeInferencer inferencer = new();

    public bool CanParse(string format)
    {
        return string.Equals(format, DiagramSourceFormats.Svg, StringComparison.OrdinalIgnoreCase);
    }

    public DiagramParseResult Parse(DiagramSourceReference source)
    {
        ArgumentNullException.ThrowIfNull(source);

        ArchitectureDiagramModelRecord model = new();
        List<string> warnings = [];

        SvgDiagramSanitizeResult sanitizeResult = SvgDiagramSanitizer.Sanitize(source.Content);
        warnings.AddRange(sanitizeResult.Warnings);

        if (string.IsNullOrWhiteSpace(sanitizeResult.SanitizedContent))
        {
            return new DiagramParseResult { Model = model, Warnings = warnings };
        }

        try
        {
            XDocument document = XDocument.Parse(sanitizeResult.SanitizedContent, LoadOptions.None);
            XElement? root = document.Root;

            if (root is null)
            {
                warnings.Add("Sanitized SVG did not contain a root element.");

                return new DiagramParseResult { Model = model, Warnings = warnings };
            }

            Dictionary<string, ArchitectureDiagramNodeRecord> nodes = new(StringComparer.Ordinal);
            ExtractGroupedShapeNodes(root, nodes);
            ExtractStandaloneShapeNodes(root, nodes);

            model.Nodes.AddRange(nodes.Values.OrderBy(node => node.Id, StringComparer.Ordinal));

            if (model.Nodes.Count == 0)
            {
                warnings.Add("No labeled SVG shapes were recognized in the source.");
            }

            return new DiagramParseResult
            {
                Model = model,
                Warnings = warnings,
                LabelOnlyInferenceConfidence = model.Nodes.Count > 0 ? this.inferencer.LabelOnlyConfidence : null,
            };
        }
        catch (Exception ex)
        {
            warnings.Add($"SVG structured parse failed for '{source.Name}': {ex.Message}");

            return new DiagramParseResult { Model = model, Warnings = warnings };
        }
    }

    private void ExtractGroupedShapeNodes(XElement root, Dictionary<string, ArchitectureDiagramNodeRecord> nodes)
    {
        foreach (XElement group in root.Descendants().Where(element =>
                     string.Equals(element.Name.LocalName, "g", StringComparison.OrdinalIgnoreCase)))
        {
            string? groupId = ReadId(group);

            if (string.IsNullOrWhiteSpace(groupId))
            {
                continue;
            }

            if (!group.Descendants().Any(element => ShapeElementNames.Contains(element.Name.LocalName)))
            {
                continue;
            }

            string? label = ReadLabel(group);

            if (string.IsNullOrWhiteSpace(label))
            {
                continue;
            }

            AddNode(nodes, groupId, label);
        }
    }

    private void ExtractStandaloneShapeNodes(XElement root, Dictionary<string, ArchitectureDiagramNodeRecord> nodes)
    {
        foreach (XElement shape in root.Descendants().Where(element => ShapeElementNames.Contains(element.Name.LocalName)))
        {
            string? shapeId = ReadId(shape);

            if (string.IsNullOrWhiteSpace(shapeId) || nodes.ContainsKey(shapeId))
            {
                continue;
            }

            string? label = ReadLabel(shape.Parent) ?? ReadLabel(shape);

            if (string.IsNullOrWhiteSpace(label))
            {
                continue;
            }

            AddNode(nodes, shapeId, label);
        }
    }

    private void AddNode(Dictionary<string, ArchitectureDiagramNodeRecord> nodes, string nodeId, string label)
    {
        if (nodes.ContainsKey(nodeId))
        {
            return;
        }

        ArchitectureDiagramNodeRecord node = new()
        {
            Id = nodeId,
            Label = label,
        };

        this.inferencer.ApplyLabelInference(node);
        nodes[nodeId] = node;
    }

    private static string? ReadId(XElement element)
    {
        string? id = element.Attribute("id")?.Value?.Trim();

        if (!string.IsNullOrWhiteSpace(id))
        {
            return id;
        }

        return element.Attribute(XName.Get("id", "http://www.w3.org/XML/1998/namespace"))?.Value?.Trim();
    }

    private static string? ReadLabel(XElement? scope)
    {
        if (scope is null)
        {
            return null;
        }

        foreach (string labelElementName in new[] { "title", "desc", "text", "tspan" })
        {
            XElement? labelElement = scope
                .Descendants()
                .FirstOrDefault(element => string.Equals(element.Name.LocalName, labelElementName, StringComparison.OrdinalIgnoreCase));

            string? text = labelElement?.Value?.Trim();

            if (!string.IsNullOrWhiteSpace(text))
            {
                return text;
            }
        }

        return null;
    }
}
