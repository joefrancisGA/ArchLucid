using ArchiForge.Core.Comparison;
using ArchiForge.Decisioning.Advisory.Models;
using ArchiForge.Decisioning.Models;

namespace ArchiForge.Decisioning.Advisory.Analysis;

public interface IImprovementSignalAnalyzer
{
    IReadOnlyList<ImprovementSignal> Analyze(
        GoldenManifest manifest,
        FindingsSnapshot findingsSnapshot,
        ComparisonResult? comparison = null);
}
