using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Catalog placeholder for <c>decision-grade-fusion</c>. Real output is merged by
///     <see cref="Findings.FindingsDecisionGradeFusionStage" /> (DX-51).
/// </summary>
public sealed class DecisionGradeFusionFindingEngine : IFindingEngine
{
    public string EngineType => DecisionGradeFusionApplicator.EngineType;

    public string Category => "Insight";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        _ = graphSnapshot;
        _ = analysisContext;
        ct.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<Finding>>([]);
    }
}
