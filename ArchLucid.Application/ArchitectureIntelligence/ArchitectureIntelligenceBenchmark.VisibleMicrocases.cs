using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ArchitectureIntelligenceBenchmark
{
    public IReadOnlyList<ExtractionFidelityCase> GetVisibleMicrocases()
    {
        return _extractionFidelityBenchmark.MicroCases
            .Where(c => !c.CaseId.StartsWith("holdout-", StringComparison.OrdinalIgnoreCase))
            .ToList();
    }
}
