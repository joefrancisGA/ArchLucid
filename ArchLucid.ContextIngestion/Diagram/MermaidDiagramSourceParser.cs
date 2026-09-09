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

    private static readonly Regex C4ActorRegex = new(
        @"^\s*Person\s*\(\s*([A-Za-z0-9_]+)\s*,\s*[""']([^""']+)[""']",
        RegexOptions.Compiled | RegexOptions.Multiline | RegexOptions.IgnoreCase);

    private static readonly Regex C4SystemRegex = new(
        @"^\s*(?:Container|System|System_Ext|Container_Ext)\s*\(\s*([A-Za-z0-9_]+)\s*,\s*[""']([^""']+)[""']",
        RegexOptions.Compiled | RegexOptions.Multiline | RegexOptions.IgnoreCase);

    private static readonly Regex C4RelRegex = new(
        @"^\s*Rel\s*\(\s*([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_]+)\s*,\s*[""']([^""']*)[""']",
        RegexOptions.Compiled | RegexOptions.Multiline | RegexOptions.IgnoreCase);

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

        foreach (Match match in C4ActorRegex.Matches(source.Content))
        {
            AddC4Node(nodes, match.Groups[1].Value, match.Groups[2].Value, ArchitectureDiagramNodeKinds.User);
        }

        foreach (Match match in C4SystemRegex.Matches(source.Content))
        {
            AddC4Node(nodes, match.Groups[1].Value, match.Groups[2].Value, ArchitectureDiagramNodeKinds.System);
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

        foreach (Match match in C4RelRegex.Matches(source.Content))
        {
            string fromId = match.Groups[1].Value;
            string toId = match.Groups[2].Value;
            string edgeLabel = match.Groups[3].Value;

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

    private static void AddC4Node(
        Dictionary<string, ArchitectureDiagramNodeRecord> nodes,
        string nodeId,
        string label,
        string kind)
    {
        if (nodes.ContainsKey(nodeId))
        {
            return;
        }

        nodes[nodeId] = new ArchitectureDiagramNodeRecord
        {
            Id = nodeId,
            Label = label,
            Kind = kind,
            Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
        };
    }
}
