using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Catalog placeholder for <c>checklist-cluster-synthesis</c>. Real output is merged by
///     <see cref="Findings.FindingsChecklistClusterStage" /> (DX-22).
/// </summary>
public sealed class ChecklistClusterSynthesisFindingEngine : IFindingEngine
{
    public string EngineType => ChecklistClusterSynthesisApplicator.EngineType;

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
