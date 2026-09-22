using ArchLucid.ArtifactSynthesis.Compilers;
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
        bool UsedResourceGroupMap,
        bool UsedBackboneKeep,
        IReadOnlyList<string> AlwaysDisposedArmTypes);

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
        IMermaidDiagramStructuralValidator structuralValidator,
        bool includeNeverShowArmTypes = false)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(thresholds);
        ArgumentNullException.ThrowIfNull(catalog);
        ArgumentNullException.ThrowIfNull(graphCompiler);
        ArgumentNullException.ThrowIfNull(diagramRenderer);
        ArgumentNullException.ThrowIfNull(complexityAnalyzer);
        ArgumentNullException.ThrowIfNull(deterministicRepairer);
        ArgumentNullException.ThrowIfNull(structuralValidator);

        IReadOnlySet<string> alwaysDisposeTypes = includeNeverShowArmTypes
            ? new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            : DiagramPeelAlwaysDisposeResolver.Resolve(catalog, graph, mode);
        GraphSnapshot workingGraph = includeNeverShowArmTypes
            ? graph
            : InventoryDiagramGraphPeelFilter.Filter(graph, alwaysDisposeTypes);
        List<string> alwaysDisposedArmTypes = includeNeverShowArmTypes
            ? []
            : graph.Nodes
                .Where(DiagramAstGraphNodeClassifier.IsTopologyResource)
                .Select(DiagramAstGraphNodeClassifier.ReadArmType)
                .Where(armType => alwaysDisposeTypes.Contains(armType))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(armType => armType, StringComparer.Ordinal)
                .ToList();

        PeelCompileResult initial = CompileOnce(
            workingGraph,
            mode,
            compileOptions,
            graphCompiler,
            diagramRenderer,
            complexityAnalyzer,
            deterministicRepairer,
            structuralValidator,
            peeledArmTypes: [],
            usedResourceGroupMap: false,
            usedBackboneKeep: false,
            alwaysDisposedArmTypes);

        if (!MermaidDiagramInventoryRenderOrchestrator.ShouldAttemptPeelBudget(mode)
            || !initial.Metrics.ExceedsReadableThresholds(thresholds))
        {
            return initial;
        }

        IReadOnlyList<string> peelOrder = DiagramPeelCatalogOrderResolver.ResolvePeelOrder(catalog, workingGraph);
        HashSet<string> excludedArmTypes = new(alwaysDisposeTypes, StringComparer.OrdinalIgnoreCase);
        List<string> peeledArmTypes = [];

        foreach (string armType in peelOrder)
        {
            if (!excludedArmTypes.Add(armType))
            {
                continue;
            }

            peeledArmTypes.Add(armType);
            GraphSnapshot filteredGraph = InventoryDiagramGraphPeelFilter.Filter(workingGraph, excludedArmTypes);

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
                usedResourceGroupMap: false,
                usedBackboneKeep: false,
                alwaysDisposedArmTypes);

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

        if (mode == DiagramMode.FullSubscription)
        {
            GraphSnapshot backboneGraph = InventoryDiagramBackboneKeepFilter.Filter(workingGraph, catalog);
            PeelCompileResult backbone = CompileOnce(
                backboneGraph,
                mode,
                CreateBackboneKeepCompileOptions(compileOptions),
                graphCompiler,
                diagramRenderer,
                complexityAnalyzer,
                deterministicRepairer,
                structuralValidator,
                peeledArmTypes,
                usedResourceGroupMap: false,
                usedBackboneKeep: true,
                alwaysDisposedArmTypes);

            if (backbone.StructurallyValid && !backbone.Metrics.ExceedsReadableThresholds(thresholds))
            {
                return backbone;
            }
        }

        if (mode == DiagramMode.FullSubscription
            && InventoryDiagramResourceGroupMapBuilder.TryBuild(workingGraph, thresholds.MaxNodes, out GraphSnapshot mapGraph))
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
                usedResourceGroupMap: true,
                usedBackboneKeep: false,
                alwaysDisposedArmTypes);

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
        bool usedResourceGroupMap,
        bool usedBackboneKeep,
        IReadOnlyList<string> alwaysDisposedArmTypes)
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
            usedResourceGroupMap,
            usedBackboneKeep,
            alwaysDisposedArmTypes);
    }

    private static DiagramAstCompileOptions CreateResourceGroupMapCompileOptions(DiagramAstCompileOptions? compileOptions)
    {
        return new DiagramAstCompileOptions
        {
            ResourceGroupName = compileOptions?.ResourceGroupName,
            SelectedNodeIds = compileOptions?.SelectedNodeIds,
            NeighborhoodSeedNodeId = compileOptions?.NeighborhoodSeedNodeId,
            NeighborhoodDepth = compileOptions?.NeighborhoodDepth ?? 2,
            HiddenExecutiveTierKeys = compileOptions?.HiddenExecutiveTierKeys,
            CollapseToResourceGroupMap = true,
        };
    }

    private static DiagramAstCompileOptions CreateBackboneKeepCompileOptions(DiagramAstCompileOptions? compileOptions)
    {
        return new DiagramAstCompileOptions
        {
            ResourceGroupName = compileOptions?.ResourceGroupName,
            SelectedNodeIds = compileOptions?.SelectedNodeIds,
            NeighborhoodSeedNodeId = compileOptions?.NeighborhoodSeedNodeId,
            NeighborhoodDepth = compileOptions?.NeighborhoodDepth ?? 2,
            HiddenExecutiveTierKeys = compileOptions?.HiddenExecutiveTierKeys,
            CollapseToBackboneKeep = true,
        };
    }
}
