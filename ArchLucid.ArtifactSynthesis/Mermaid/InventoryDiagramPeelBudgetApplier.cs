using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

internal static class InventoryDiagramPeelBudgetApplier
{
    internal sealed record PeelCompileResult(
        DiagramAst RepairedAst,
        string Mermaid,
        MermaidDiagramComplexityMetrics Metrics,
        bool StructurallyValid,
        IReadOnlyList<string> PeeledArmTypes,
        bool UsedResourceGroupMap);

    public static PeelCompileResult CompileWithPeelBudget(
        GraphSnapshot graph,
        DiagramMode mode,
        DiagramAstCompileOptions? compileOptions,
        MermaidDiagramReadabilityThresholds thresholds,
        DiagramPeelCatalogSnapshot catalog,
        IDiagramAstFromGraphCompiler graphCompiler,
        IDiagramRenderer diagramRenderer,
        IMermaidDiagramComplexityAnalyzer complexityAnalyzer,
        IMermaidDiagramDeterministicRepairer deterministicRepairer,
        IMermaidDiagramStructuralValidator structuralValidator)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(thresholds);
        ArgumentNullException.ThrowIfNull(catalog);
        ArgumentNullException.ThrowIfNull(graphCompiler);
        ArgumentNullException.ThrowIfNull(diagramRenderer);
        ArgumentNullException.ThrowIfNull(complexityAnalyzer);
        ArgumentNullException.ThrowIfNull(deterministicRepairer);
        ArgumentNullException.ThrowIfNull(structuralValidator);

        PeelCompileResult initial = CompileOnce(
            graph,
            mode,
            compileOptions,
            graphCompiler,
            diagramRenderer,
            complexityAnalyzer,
            deterministicRepairer,
            structuralValidator,
            peeledArmTypes: [],
            usedResourceGroupMap: false);

        if (!MermaidDiagramInventoryRenderOrchestrator.ShouldAttemptPeelBudget(mode)
            || !initial.Metrics.ExceedsReadableThresholds(thresholds))
        {
            return initial;
        }

        IReadOnlyList<string> peelOrder = DiagramPeelCatalogOrderResolver.ResolvePeelOrder(catalog, graph);
        HashSet<string> excludedArmTypes = new(StringComparer.OrdinalIgnoreCase);
        List<string> peeledArmTypes = [];

        foreach (string armType in peelOrder)
        {
            if (!excludedArmTypes.Add(armType))
            {
                continue;
            }

            peeledArmTypes.Add(armType);
            GraphSnapshot filteredGraph = InventoryDiagramGraphPeelFilter.Filter(graph, excludedArmTypes);

            PeelCompileResult peeled = CompileOnce(
                filteredGraph,
                mode,
                compileOptions,
                graphCompiler,
                diagramRenderer,
                complexityAnalyzer,
                deterministicRepairer,
                structuralValidator,
                peeledArmTypes,
                usedResourceGroupMap: false);

            if (!peeled.Metrics.ExceedsReadableThresholds(thresholds) && peeled.StructurallyValid)
            {
                return peeled;
            }

            if (!peeled.StructurallyValid)
            {
                excludedArmTypes.Remove(armType);
                peeledArmTypes.RemoveAt(peeledArmTypes.Count - 1);
            }
        }

        if (mode == DiagramMode.FullSubscription
            && InventoryDiagramResourceGroupMapBuilder.TryBuild(graph, thresholds.MaxNodes, out GraphSnapshot mapGraph))
        {
            PeelCompileResult mapped = CompileOnce(
                mapGraph,
                mode,
                CreateResourceGroupMapCompileOptions(compileOptions),
                graphCompiler,
                diagramRenderer,
                complexityAnalyzer,
                deterministicRepairer,
                structuralValidator,
                peeledArmTypes,
                usedResourceGroupMap: true);

            if (mapped.StructurallyValid)
            {
                return mapped;
            }
        }

        return initial;
    }

    private static PeelCompileResult CompileOnce(
        GraphSnapshot graph,
        DiagramMode mode,
        DiagramAstCompileOptions? compileOptions,
        IDiagramAstFromGraphCompiler graphCompiler,
        IDiagramRenderer diagramRenderer,
        IMermaidDiagramComplexityAnalyzer complexityAnalyzer,
        IMermaidDiagramDeterministicRepairer deterministicRepairer,
        IMermaidDiagramStructuralValidator structuralValidator,
        IReadOnlyList<string> peeledArmTypes,
        bool usedResourceGroupMap)
    {
        DiagramAst ast = graphCompiler.Compile(graph, mode, compileOptions);
        DiagramAst repaired = deterministicRepairer.Repair(ast, out _);
        string mermaid = diagramRenderer.Render(repaired);
        MermaidDiagramComplexityMetrics metrics = complexityAnalyzer.Analyze(repaired, mermaid);
        bool structurallyValid = structuralValidator.TryValidate(mermaid, out _);

        return new PeelCompileResult(
            repaired,
            mermaid,
            metrics,
            structurallyValid,
            peeledArmTypes,
            usedResourceGroupMap);
    }

    private static DiagramAstCompileOptions CreateResourceGroupMapCompileOptions(DiagramAstCompileOptions? compileOptions)
    {
        return new DiagramAstCompileOptions
        {
            ResourceGroupName = compileOptions?.ResourceGroupName,
            SelectedNodeIds = compileOptions?.SelectedNodeIds,
            NeighborhoodSeedNodeId = compileOptions?.NeighborhoodSeedNodeId,
            NeighborhoodDepth = compileOptions?.NeighborhoodDepth ?? 2,
            CollapseToResourceGroupMap = true,
        };
    }
}
