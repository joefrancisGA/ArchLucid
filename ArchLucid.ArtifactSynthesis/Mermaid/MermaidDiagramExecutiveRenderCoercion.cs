using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

/// <summary>
/// Executive inventory diagrams must not surface partitioned/too-large outcomes when structurally valid.
/// Node count is not capped at render coercion — all VNets, peering endpoints, and budgeted always-show tiers stay visible (IDL-06).
/// </summary>
internal static class MermaidDiagramExecutiveRenderCoercion
{
    public static MermaidDiagramRenderResult Coerce(DiagramMode mode, MermaidDiagramRenderResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        if (mode != DiagramMode.Executive)
        {
            return result;
        }

        if (result.Status != MermaidDiagramRenderStatus.Partitioned)
        {
            return result;
        }

        if (result.ValidationErrors.Count > 0)
        {
            return result;
        }

        if (string.IsNullOrWhiteSpace(result.PrimaryMermaid))
        {
            return result;
        }

        return new MermaidDiagramRenderResult
        {
            Status = MermaidDiagramRenderStatus.Succeeded,
            PrimaryMermaid = result.PrimaryMermaid,
            Metrics = result.Metrics,
            CollapseReport = result.CollapseReport,
            ValidationErrors = result.ValidationErrors,
            RepairedAst = result.RepairedAst,
        };
    }

    public static MermaidDiagramRenderStatus ResolveFallbackArtifactStatus(
        DiagramMode mode,
        bool structurallyValid,
        MermaidDiagramComplexityMetrics metrics,
        MermaidDiagramReadabilityThresholds thresholds)
    {
        ArgumentNullException.ThrowIfNull(metrics);
        ArgumentNullException.ThrowIfNull(thresholds);

        if (!structurallyValid)
        {
            return MermaidDiagramRenderStatus.Failed;
        }

        if (mode == DiagramMode.Executive)
        {
            return MermaidDiagramRenderStatus.Succeeded;
        }

        if (metrics.ExceedsReadableThresholds(thresholds))
        {
            return MermaidDiagramRenderStatus.Partitioned;
        }

        return MermaidDiagramRenderStatus.Succeeded;
    }
}
