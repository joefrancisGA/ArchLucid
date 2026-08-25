using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Resolves sponsor-facing material findings from agent results, falling back to persisted snapshot rows
///     already projected into <see cref="PilotRunDeltas.SnapshotFallbackFindings" /> by <see cref="PilotRunDeltaComputer" />.
/// </summary>
internal static class PilotMaterialFindingsCollector
{
    public static List<ArchitectureFinding> Collect(ArchitectureRunDetail detail, PilotRunDeltas deltas, int take)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(deltas);

        List<ArchitectureFinding> fromResults = detail.Results
            .SelectMany(static result => result.Findings)
            .Where(static finding => !finding.IsMuted)
            .OrderByDescending(static finding => finding.Severity)
            .ThenBy(static finding => finding.Category, StringComparer.OrdinalIgnoreCase)
            .Take(take)
            .ToList();

        if (fromResults.Count > 0)
            return fromResults;

        return deltas.SnapshotFallbackFindings
            .Where(static finding => !finding.IsMuted)
            .OrderByDescending(static finding => finding.Severity)
            .ThenBy(static finding => finding.Category, StringComparer.OrdinalIgnoreCase)
            .Take(take)
            .ToList();
    }
}
