using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class MermaidDiagramRenderPipeline : IMermaidDiagramRenderPipeline
{
    private readonly IDiagramRenderer diagramRenderer;
    private readonly IMermaidDiagramComplexityAnalyzer complexityAnalyzer;
    private readonly IMermaidDiagramDeterministicRepairer deterministicRepairer;
    private readonly IMermaidDiagramStructuralValidator structuralValidator;
    private readonly IMermaidDiagramSemanticIntegrityGuard semanticIntegrityGuard;
    private readonly IMermaidDiagramFallbackSetBuilder fallbackSetBuilder;

    public MermaidDiagramRenderPipeline(
        IDiagramRenderer diagramRenderer,
        IMermaidDiagramComplexityAnalyzer complexityAnalyzer,
        IMermaidDiagramDeterministicRepairer deterministicRepairer,
        IMermaidDiagramStructuralValidator structuralValidator,
        IMermaidDiagramSemanticIntegrityGuard semanticIntegrityGuard,
        IMermaidDiagramFallbackSetBuilder fallbackSetBuilder)
    {
        this.diagramRenderer = diagramRenderer;
        this.complexityAnalyzer = complexityAnalyzer;
        this.deterministicRepairer = deterministicRepairer;
        this.structuralValidator = structuralValidator;
        this.semanticIntegrityGuard = semanticIntegrityGuard;
        this.fallbackSetBuilder = fallbackSetBuilder;
    }

    public async Task<MermaidDiagramRenderResult> RenderAsync(
        MermaidDiagramRenderRequest request,
        GraphSnapshot? sourceGraph = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.Ast);

        DiagramAst repaired = this.deterministicRepairer.Repair(request.Ast, out MermaidDiagramCollapseReport repairCollapse);
        string mermaid = this.diagramRenderer.Render(repaired);
        MermaidDiagramComplexityMetrics metrics = this.complexityAnalyzer.Analyze(repaired, mermaid);

        if (metrics.ExceedsReadableThresholds(request.Thresholds))
        {
            IReadOnlyList<MermaidDiagramRenderArtifact> fallbacks = sourceGraph is null
                ? []
                : this.fallbackSetBuilder.BuildFallbackSet(sourceGraph, request.Thresholds);

            return new MermaidDiagramRenderResult
            {
                Status = MermaidDiagramRenderStatus.Partitioned,
                PrimaryMermaid = mermaid,
                Metrics = metrics,
                FallbackArtifacts = fallbacks,
                IndexMarkdown = fallbacks.Count > 0
                    ? MermaidDiagramFallbackSetBuilder.BuildIndexMarkdown(fallbacks)
                    : null,
                CollapseReport = repairCollapse,
            };
        }

        if (!this.structuralValidator.TryValidate(mermaid, out IReadOnlyList<string> validationErrors))
        {
            DiagramAst? aiRepaired = await TryAiRepairAsync(request, repaired, validationErrors, cancellationToken);

            if (aiRepaired is not null)
            {
                if (!this.semanticIntegrityGuard.TryValidateRepair(
                        repaired,
                        aiRepaired,
                        request.RequiredCloudResourceIds,
                        out MermaidDiagramCollapseReport aiCollapse))
                {
                    return new MermaidDiagramRenderResult
                    {
                        Status = MermaidDiagramRenderStatus.Failed,
                        Metrics = metrics,
                        CollapseReport = aiCollapse,
                        ValidationErrors = validationErrors,
                    };
                }

                repaired = aiRepaired;
                mermaid = this.diagramRenderer.Render(repaired);
                metrics = this.complexityAnalyzer.Analyze(repaired, mermaid);

                if (!this.structuralValidator.TryValidate(mermaid, out validationErrors))
                {
                    return new MermaidDiagramRenderResult
                    {
                        Status = MermaidDiagramRenderStatus.Failed,
                        Metrics = metrics,
                        ValidationErrors = validationErrors,
                    };
                }
            }
            else
            {
                return new MermaidDiagramRenderResult
                {
                    Status = MermaidDiagramRenderStatus.Failed,
                    Metrics = metrics,
                    ValidationErrors = validationErrors,
                };
            }
        }

        if (metrics.ExceedsReadableThresholds(request.Thresholds))
        {
            IReadOnlyList<MermaidDiagramRenderArtifact> fallbacks = sourceGraph is null
                ? []
                : this.fallbackSetBuilder.BuildFallbackSet(sourceGraph, request.Thresholds);

            return new MermaidDiagramRenderResult
            {
                Status = MermaidDiagramRenderStatus.Partitioned,
                PrimaryMermaid = mermaid,
                Metrics = metrics,
                FallbackArtifacts = fallbacks,
                IndexMarkdown = fallbacks.Count > 0
                    ? MermaidDiagramFallbackSetBuilder.BuildIndexMarkdown(fallbacks)
                    : null,
                CollapseReport = repairCollapse,
            };
        }

        return new MermaidDiagramRenderResult
        {
            Status = MermaidDiagramRenderStatus.Succeeded,
            PrimaryMermaid = mermaid,
            Metrics = metrics,
            CollapseReport = repairCollapse,
        };
    }

    private static async Task<DiagramAst?> TryAiRepairAsync(
        MermaidDiagramRenderRequest request,
        DiagramAst repaired,
        IReadOnlyList<string> validationErrors,
        CancellationToken cancellationToken)
    {
        if (!request.AllowAiRepair || request.AiRepairer is null)
        {
            return null;
        }

        return await request.AiRepairer.TryRepairAsync(repaired, validationErrors, cancellationToken);
    }
}
