using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class MermaidDiagramInventoryRenderOrchestrator : IMermaidDiagramInventoryRenderOrchestrator
{
    private readonly IDiagramAstFromGraphCompiler graphCompiler;
    private readonly IMermaidDiagramRenderPipeline renderPipeline;
    private readonly IDiagramPeelCatalogProvider peelCatalogProvider;
    private readonly IDiagramRenderer diagramRenderer;
    private readonly IMermaidDiagramComplexityAnalyzer complexityAnalyzer;
    private readonly IMermaidDiagramDeterministicRepairer deterministicRepairer;
    private readonly IMermaidDiagramStructuralValidator structuralValidator;

    public MermaidDiagramInventoryRenderOrchestrator(
        IDiagramAstFromGraphCompiler graphCompiler,
        IMermaidDiagramRenderPipeline renderPipeline,
        IDiagramPeelCatalogProvider peelCatalogProvider,
        IDiagramRenderer diagramRenderer,
        IMermaidDiagramComplexityAnalyzer complexityAnalyzer,
        IMermaidDiagramDeterministicRepairer deterministicRepairer,
        IMermaidDiagramStructuralValidator structuralValidator)
    {
        this.graphCompiler = graphCompiler;
        this.renderPipeline = renderPipeline;
        this.peelCatalogProvider = peelCatalogProvider;
        this.diagramRenderer = diagramRenderer;
        this.complexityAnalyzer = complexityAnalyzer;
        this.deterministicRepairer = deterministicRepairer;
        this.structuralValidator = structuralValidator;
    }

    public async Task<MermaidDiagramRenderResult> RenderFromGraphAsync(
        GraphSnapshot graph,
        DiagramMode mode,
        DiagramAstCompileOptions? compileOptions,
        MermaidDiagramReadabilityThresholds thresholds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(thresholds);

        DiagramPeelCatalogSnapshot catalog = await this.peelCatalogProvider.GetCatalogAsync(cancellationToken);

        InventoryDiagramPeelBudgetApplier.PeelCompileResult compiled = InventoryDiagramPeelBudgetApplier.CompileWithPeelBudget(
            graph,
            mode,
            compileOptions,
            thresholds,
            catalog,
            this.graphCompiler,
            this.diagramRenderer,
            this.complexityAnalyzer,
            this.deterministicRepairer,
            this.structuralValidator);

        MermaidDiagramRenderResult result = await this.renderPipeline.RenderAsync(
            new MermaidDiagramRenderRequest
            {
                Ast = compiled.RepairedAst,
                Thresholds = thresholds,
            },
            graph,
            cancellationToken);

        if (compiled.PeeledArmTypes.Count == 0 && !compiled.UsedResourceGroupMap)
        {
            return result;
        }

        return new MermaidDiagramRenderResult
        {
            Status = result.Status,
            PrimaryMermaid = result.PrimaryMermaid,
            Metrics = result.Metrics,
            FallbackArtifacts = result.FallbackArtifacts,
            IndexMarkdown = result.IndexMarkdown,
            CollapseReport = MergePeelCollapseReport(
                result.CollapseReport,
                compiled.PeeledArmTypes,
                catalog.CatalogVersion,
                compiled.UsedResourceGroupMap),
            ValidationErrors = result.ValidationErrors,
        };
    }

    public MermaidDiagramRenderArtifact BuildFallbackArtifact(
        GraphSnapshot graph,
        DiagramMode mode,
        string key,
        string label,
        MermaidDiagramReadabilityThresholds thresholds,
        DiagramAstCompileOptions? compileOptions)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(thresholds);

        DiagramPeelCatalogSnapshot catalog = this.peelCatalogProvider
            .GetCatalogAsync(CancellationToken.None)
            .GetAwaiter()
            .GetResult();

        InventoryDiagramPeelBudgetApplier.PeelCompileResult compiled = InventoryDiagramPeelBudgetApplier.CompileWithPeelBudget(
            graph,
            mode,
            compileOptions,
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

        return new MermaidDiagramRenderArtifact
        {
            Key = key,
            Label = label,
            Mermaid = compiled.Mermaid,
            Status = status,
            Metrics = compiled.Metrics,
        };
    }

    internal static bool ShouldAttemptPeelBudget(DiagramMode mode)
    {
        return mode is not DiagramMode.Executive
            and not DiagramMode.DependencyNeighborhood
            and not DiagramMode.SelectedResources;
    }

    private static MermaidDiagramCollapseReport MergePeelCollapseReport(
        MermaidDiagramCollapseReport? repairCollapse,
        IReadOnlyList<string> peeledArmTypes,
        int catalogVersion,
        bool usedResourceGroupMap)
    {
        List<MermaidDiagramCollapseEntry> entries = repairCollapse?.Entries.ToList() ?? [];

        foreach (string armType in peeledArmTypes)
        {
            entries.Add(new MermaidDiagramCollapseEntry
            {
                Kind = "PeelBudgetArmType",
                Reason = $"Hidden to fit readability thresholds (catalog v{catalogVersion}): {armType}",
            });
        }

        if (usedResourceGroupMap)
        {
            entries.Add(new MermaidDiagramCollapseEntry
            {
                Kind = InventoryDiagramResourceGroupMapBuilder.CollapseKind,
                Reason = InventoryDiagramResourceGroupMapBuilder.Caption,
            });
        }

        return new MermaidDiagramCollapseReport { Entries = entries };
    }
}
