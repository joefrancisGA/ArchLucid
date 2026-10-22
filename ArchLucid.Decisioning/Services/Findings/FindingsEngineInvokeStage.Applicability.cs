using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Decisioning.Services.Findings;

partial class FindingsEngineInvokeStage
{
    private static EngineAdapter[] SelectApplicableAdapters(
        IReadOnlyList<EngineAdapter> adapters,
        FindingAnalysisContext? analysisContext)
    {
        return adapters
            .Where(adapter => CrossRunDiffFindingPriorGuard.ShouldInvoke(adapter.EngineType, analysisContext))
            .ToArray();
    }
}
