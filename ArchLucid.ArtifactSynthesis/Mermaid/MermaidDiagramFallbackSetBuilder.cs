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
    private readonly IDiagramPeelCatalogProvider peelCatalogProvider;

    public MermaidDiagramFallbackSetBuilder(
        IDiagramAstFromGraphCompiler graphCompiler,
        IDiagramRenderer diagramRenderer,
        IMermaidDiagramComplexityAnalyzer complexityAnalyzer,
        IMermaidDiagramDeterministicRepairer deterministicRepairer,
        IMermaidDiagramStructuralValidator structuralValidator,
        IDiagramPeelCatalogProvider peelCatalogProvider)
    {
        this.graphCompiler = graphCompiler;
        this.diagramRenderer = diagramRenderer;
        this.complexityAnalyzer = complexityAnalyzer;
        this.deterministicRepairer = deterministicRepairer;
        this.structuralValidator = structuralValidator;
        this.peelCatalogProvider = peelCatalogProvider;
    }

    public IReadOnlyList<MermaidDiagramRenderArtifact> BuildFallbackSet(
        GraphSnapshot graph,
        MermaidDiagramReadabilityThresholds thresholds)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(thresholds);

        List<MermaidDiagramRenderArtifact> artifacts = [];

        AddModeArtifact(artifacts, graph, DiagramMode.Executive, InventoryDiagramFallbackArtifactKeys.Executive, thresholds, null);
        AddModeArtifact(artifacts, graph, DiagramMode.Network, InventoryDiagramFallbackArtifactKeys.Network, thresholds, null);
        AddModeArtifact(artifacts, graph, DiagramMode.Identity, InventoryDiagramFallbackArtifactKeys.Identity, thresholds, null);
        AddModeArtifact(artifacts, graph, DiagramMode.Data, InventoryDiagramFallbackArtifactKeys.Data, thresholds, null);
        AddModeArtifact(artifacts, graph, DiagramMode.Architecture, InventoryDiagramFallbackArtifactKeys.CrossBoundary, thresholds, null);

        return artifacts;
    }

    public IReadOnlyList<MermaidDiagramRenderArtifact> BuildResourceGroupFallbackSet(
        GraphSnapshot graph,
        MermaidDiagramReadabilityThresholds thresholds)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(thresholds);

        List<MermaidDiagramRenderArtifact> artifacts = [];

        foreach (string resourceGroup in ListResourceGroupNames(graph))
        {
            AddModeArtifact(
                artifacts,
                graph,
                DiagramMode.ResourceGroup,
                InventoryDiagramFallbackArtifactKeys.ForResourceGroup(resourceGroup),
                thresholds,
                new DiagramAstCompileOptions { ResourceGroupName = resourceGroup });
        }

        return artifacts;
    }

    public static string BuildIndexMarkdown(IReadOnlyList<MermaidDiagramRenderArtifact> artifacts)
    {
        System.Text.StringBuilder builder = new();
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
        Contracts.InfraEvidence.DiagramPeel.DiagramPeelCatalogSnapshot catalog = this.peelCatalogProvider
            .GetCatalogAsync(CancellationToken.None)
            .GetAwaiter()
            .GetResult();

        InventoryDiagramPeelBudgetApplier.PeelCompileResult compiled = InventoryDiagramPeelBudgetApplier.CompileWithPeelBudget(
            graph,
            mode,
            options,
            thresholds,
            catalog,
            this.graphCompiler,
            this.diagramRenderer,
            this.complexityAnalyzer,
            this.deterministicRepairer,
            this.structuralValidator);

        MermaidDiagramRenderStatus status = !compiled.StructurallyValid
            ? MermaidDiagramRenderStatus.Failed
            : compiled.Metrics.ExceedsReadableThresholds(thresholds)
                ? MermaidDiagramRenderStatus.Partitioned
                : MermaidDiagramRenderStatus.Succeeded;

        artifacts.Add(new MermaidDiagramRenderArtifact
        {
            Key = key,
            Label = ResolveFallbackLabel(mode, key, options),
            Mermaid = compiled.Mermaid,
            Status = status,
            Metrics = compiled.Metrics,
        });
    }

    private static IReadOnlyList<string> ListResourceGroupNames(GraphSnapshot graph)
    {
        return graph.Nodes
            .Select(DiagramAstGraphNodeClassifier.ReadResourceGroup)
            .Where(resourceGroup => !string.IsNullOrWhiteSpace(resourceGroup))
            .Select(resourceGroup => resourceGroup!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(resourceGroup => resourceGroup, StringComparer.Ordinal)
            .ToList();
    }

    private static string ResolveFallbackLabel(DiagramMode mode, string key, DiagramAstCompileOptions? options)
    {
        if (mode == DiagramMode.ResourceGroup && !string.IsNullOrWhiteSpace(options?.ResourceGroupName))
        {
            return options.ResourceGroupName;
        }

        return $"{mode} ({key})";
    }
}
