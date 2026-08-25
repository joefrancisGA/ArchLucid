using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Resolves sponsor-facing material findings from agent results, falling back to
///     <see cref="PilotRunDeltas.SponsorNarrativeFindings" /> when results are empty.
/// </summary>
public static class PilotSponsorMaterialFindingsResolver
{
    public static IReadOnlyList<ArchitectureFinding> Resolve(ArchitectureRunDetail detail, PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(deltas);

        List<ArchitectureFinding> agentFindings = detail.Results
            .SelectMany(static result => result.Findings)
            .Where(static finding => !finding.IsMuted)
            .ToList();

        if (agentFindings.Count > 0)
            return agentFindings;

        return deltas.SponsorNarrativeFindings;
    }
}
