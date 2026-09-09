using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Catalog placeholder for <c>insight-generator</c>. Real output is merged by
///     <see cref="Findings.FindingsInsightGeneratorStage" /> (DX-10).
/// </summary>
public sealed class InsightGeneratorFindingEngine : IFindingEngine
{
    public string EngineType => "insight-generator";

    public string Category => "Security";

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
