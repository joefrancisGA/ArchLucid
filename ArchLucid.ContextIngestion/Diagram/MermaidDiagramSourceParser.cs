using System.Text.RegularExpressions;

using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

public sealed class MermaidDiagramSourceParser : IDiagramSourceParser
{
    private static readonly Regex NodeRegex = new(
        @"^\s*([A-Za-z0-9_]+)\[[""']([^""']+)[""']\]",
        RegexOptions.Compiled | RegexOptions.Multiline);

    private static readonly Regex EdgeRegex = new(
        @"^\s*([A-Za-z0-9_]+)\s*-->\s*(?:\|""?([^""|]*)""?\|\s*)?([A-Za-z0-9_]+)",
        RegexOptions.Compiled | RegexOptions.Multiline);

    private readonly ArchitectureDiagramServiceTypeInferencer inferencer = new();

    public bool CanParse(string format)
    {
        return string.Equals(format, DiagramSourceFormats.Mermaid, StringComparison.OrdinalIgnoreCase);
    }

    public DiagramParseResult Parse(DiagramSourceReference source)
    {
        ArgumentNullException.ThrowIfNull(source);

        ArchitectureDiagramModelRecord model = new();
        List<string> warnings = [];

        if (string.IsNullOrWhiteSpace(source.Content))
        {
            warnings.Add("Mermaid source was empty.");

            return new DiagramParseResult { Model = model, Warnings = warnings };
        }

        Dictionary<string, ArchitectureDiagramNodeRecord> nodes = new(StringComparer.Ordinal);

        foreach (Match match in NodeRegex.Matches(source.Content))
        {
            string nodeId = match.Groups[1].Value;
            string label = match.Groups[2].Value;

            if (nodes.ContainsKey(nodeId))
            {
                continue;
            }

            ArchitectureDiagramNodeRecord node = new()
            {
                Id = nodeId,
                Label = label,
            };

            this.inferencer.ApplyLabelInference(node);
            nodes[nodeId] = node;
        }

        int edgeIndex = 0;

        foreach (Match match in EdgeRegex.Matches(source.Content))
        {
            string fromId = match.Groups[1].Value;
            string edgeLabel = match.Groups[2].Value;
            string toId = match.Groups[3].Value;

            EnsurePlaceholderNode(nodes, fromId);
            EnsurePlaceholderNode(nodes, toId);

            model.Edges.Add(new ArchitectureDiagramEdgeRecord
            {
                Id = $"edge-{edgeIndex++}",
                SourceId = fromId,
                TargetId = toId,
                Label = edgeLabel,
                Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
            });
        }

        model.Nodes.AddRange(nodes.Values.OrderBy(node => node.Id, StringComparer.Ordinal));

        if (model.Nodes.Count == 0)
        {
            warnings.Add("No Mermaid nodes were recognized in the source.");
        }

        return new DiagramParseResult
        {
            Model = model,
            Warnings = warnings,
            LabelOnlyInferenceConfidence = model.Nodes.Count > 0 ? this.inferencer.LabelOnlyConfidence : null,
        };
    }

    private void EnsurePlaceholderNode(Dictionary<string, ArchitectureDiagramNodeRecord> nodes, string nodeId)
    {
        if (nodes.ContainsKey(nodeId))
        {
            return;
        }

        ArchitectureDiagramNodeRecord node = new()
        {
            Id = nodeId,
            Label = nodeId,
        };

        this.inferencer.ApplyLabelInference(node);
        nodes[nodeId] = node;
    }
}
