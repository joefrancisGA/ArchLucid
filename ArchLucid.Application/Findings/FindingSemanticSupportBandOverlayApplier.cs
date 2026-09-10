using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence;

namespace ArchLucid.Application.Findings;

/// <summary>AS-060: merge persisted semantic support band overlays onto live wire models.</summary>
public static class FindingSemanticSupportBandOverlayApplier
{
    public static void ApplyToAgentResults(
        IReadOnlyList<AgentResult> results,
        IReadOnlyDictionary<string, FindingSemanticSupportBandOverlayRecord> overlays)
    {
        ArgumentNullException.ThrowIfNull(results);
        ArgumentNullException.ThrowIfNull(overlays);

        if (overlays.Count == 0)
            return;

        foreach (AgentResult result in results)
        {
            foreach (ArchitectureFinding finding in result.Findings)
            {
                if (!overlays.TryGetValue(finding.FindingId, out FindingSemanticSupportBandOverlayRecord? overlay))
                    continue;

                finding.SemanticSupportBand = overlay.Band;
            }
        }
    }

    public static void ApplyToFindings(
        IReadOnlyList<Finding> findings,
        IReadOnlyDictionary<string, FindingSemanticSupportBandOverlayRecord> overlays)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(overlays);

        if (overlays.Count == 0)
            return;

        foreach (Finding finding in findings)
        {
            if (!overlays.TryGetValue(finding.FindingId, out FindingSemanticSupportBandOverlayRecord? overlay))
                continue;

            finding.SemanticSupportBand = overlay.Band;
        }
    }
}
