using System.Text;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class MermaidDiagramFallbackSetBuilder : IMermaidDiagramFallbackSetBuilder
{
    private readonly IDiagramAstFromGraphCompiler graphCompiler;
    private readonly IDiagramRenderer diagramRenderer;
    private readonly IMermaidDiagramComplexityAnalyzer complexityAnalyzer;
    private readonly IMermaidDiagramDeterministicRepairer deterministicRepairer;
    private readonly IMermaidDiagramStructuralValidator structuralValidator;

    public MermaidDiagramFallbackSetBuilder(
        IDiagramAstFromGraphCompiler graphCompiler,
        IDiagramRenderer diagramRenderer,
        IMermaidDiagramComplexityAnalyzer complexityAnalyzer,
        IMermaidDiagramDeterministicRepairer deterministicRepairer,
        IMermaidDiagramStructuralValidator structuralValidator)
    {
        this.graphCompiler = graphCompiler;
        this.diagramRenderer = diagramRenderer;
        this.complexityAnalyzer = complexityAnalyzer;
        this.deterministicRepairer = deterministicRepairer;
        this.structuralValidator = structuralValidator;
    }

    public IReadOnlyList<MermaidDiagramRenderArtifact> BuildFallbackSet(
        GraphSnapshot graph,
        MermaidDiagramReadabilityThresholds thresholds)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(thresholds);

        List<MermaidDiagramRenderArtifact> artifacts = [];

        AddModeArtifact(artifacts, graph, DiagramMode.FullSubscription, "full-machine", thresholds, null);
        AddModeArtifact(artifacts, graph, DiagramMode.Executive, "executive", thresholds, null);
        AddModeArtifact(artifacts, graph, DiagramMode.Network, "network", thresholds, null);
        AddModeArtifact(artifacts, graph, DiagramMode.Identity, "identity", thresholds, null);
        AddModeArtifact(artifacts, graph, DiagramMode.Data, "data", thresholds, null);
        AddModeArtifact(artifacts, graph, DiagramMode.Architecture, "cross-boundary", thresholds, null);

        List<string> resourceGroups = graph.Nodes
            .Select(node => DiagramAstGraphNodeClassifier.ReadResourceGroup(node))
            .Where(resourceGroup => !string.IsNullOrWhiteSpace(resourceGroup))
            .Select(resourceGroup => resourceGroup!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(resourceGroup => resourceGroup, StringComparer.Ordinal)
            .ToList();

        foreach (string resourceGroup in resourceGroups)
        {
            AddModeArtifact(
                artifacts,
                graph,
                DiagramMode.ResourceGroup,
                $"rg-{resourceGroup}",
                thresholds,
                new DiagramAstCompileOptions { ResourceGroupName = resourceGroup });
        }

        return artifacts;
    }

    public static string BuildIndexMarkdown(IReadOnlyList<MermaidDiagramRenderArtifact> artifacts)
    {
        StringBuilder builder = new();
        builder.AppendLine("# Inventory diagram index");
        builder.AppendLine();
        builder.AppendLine("Partitioned render — use a focused variant below.");
        builder.AppendLine();

        foreach (MermaidDiagramRenderArtifact artifact in artifacts)
        {
            builder.AppendLine($"- **{artifact.Label}** (`{artifact.Key}`) — {artifact.Status}");
        }

        return builder.ToString();
    }

    private void AddModeArtifact(
        List<MermaidDiagramRenderArtifact> artifacts,
        GraphSnapshot graph,
        DiagramMode mode,
        string key,
        MermaidDiagramReadabilityThresholds thresholds,
        DiagramAstCompileOptions? options)
    {
        DiagramAst ast = this.graphCompiler.Compile(graph, mode, options);
        DiagramAst repaired = this.deterministicRepairer.Repair(ast, out _);
        string mermaid = this.diagramRenderer.Render(repaired);
        MermaidDiagramComplexityMetrics metrics = this.complexityAnalyzer.Analyze(repaired, mermaid);
        bool valid = this.structuralValidator.TryValidate(mermaid, out _);

        MermaidDiagramRenderStatus status = !valid
            ? MermaidDiagramRenderStatus.Failed
            : metrics.ExceedsReadableThresholds(thresholds)
                ? MermaidDiagramRenderStatus.Partitioned
                : MermaidDiagramRenderStatus.Succeeded;

        artifacts.Add(new MermaidDiagramRenderArtifact
        {
            Key = key,
            Label = $"{mode} ({key})",
            Mermaid = mermaid,
            Status = status,
            Metrics = metrics,
        });
    }
}
