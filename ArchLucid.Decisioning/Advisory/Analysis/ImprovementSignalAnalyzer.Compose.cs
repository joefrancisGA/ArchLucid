using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Advisory.Models;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Advisory.Analysis;

public sealed partial class ImprovementSignalAnalyzer
{
    /// <inheritdoc />
    /// <remarks>
    ///     Currently does not read individual findings from <paramref name="findingsSnapshot" />; extension points use
    ///     manifest and comparison only.
    /// </remarks>
    public IReadOnlyList<ImprovementSignal> Analyze(
        ManifestDocument manifest,
        FindingsSnapshot findingsSnapshot,
        ComparisonResult? comparison = null)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(findingsSnapshot);

        List<ImprovementSignal> signals = [];

        CollectManifestSignals(manifest, signals);

        if (comparison is not null)
            RankAndFilterComparisonSignals(comparison, signals);

        return signals;
    }
}
