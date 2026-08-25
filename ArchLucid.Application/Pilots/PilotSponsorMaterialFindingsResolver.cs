using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Resolves sponsor-facing material findings for narrative sections, preferring agent results and falling back to
///     persisted snapshot projections already surfaced on <see cref="PilotRunDeltas"/>.
/// </summary>
internal static class PilotSponsorMaterialFindingsResolver
{
    internal static IReadOnlyList<ArchitectureFinding> Resolve(ArchitectureRunDetail detail, PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(deltas);

        List<ArchitectureFinding> fromAgentResults = detail.Results
            .SelectMany(static result => result.Findings)
            .Where(static finding => !finding.IsMuted)
            .OrderByDescending(static finding => finding.Severity)
            .ThenBy(static finding => finding.Category, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (fromAgentResults.Count > 0)
            return fromAgentResults;

        return deltas.SponsorNarrativeFindings;
    }
}
