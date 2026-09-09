using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Decisioning.Merge;

/// <summary>
///     TB-2222 / LP-03: holds agent findings without Kind B provenance and gates governance lift to typed emission paths.
/// </summary>
public static class AgentArchitectureFindingEmissionGate
{
    public static bool HasTypedEmission(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        return AgentArchitectureFindingProvenanceValidator.HasKindBProvenance(finding);
    }

    public static void ApplyToResults(IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(results);

        foreach (AgentResult result in results)
        {
            if (result.Findings is not { Count: > 0 } findings)
                continue;

            List<ArchitectureFinding> retained = [];

            foreach (ArchitectureFinding finding in findings)
            {
                if (HasTypedEmission(finding))
                {
                    retained.Add(finding);
                    continue;
                }

                string withheldReason = ResolveWithheldReason(finding);
                result.WithheldFindings.Add(WithheldFindingSummaryMapper.FromHeldAgentFinding(finding, result, withheldReason));
            }

            result.Findings = retained;
        }
    }

    private static string ResolveWithheldReason(ArchitectureFinding finding)
    {
        bool hasAnyRef = finding.EvidenceRefs is { Count: > 0 } refs
                         && refs.Any(static reference => !string.IsNullOrWhiteSpace(reference));

        return hasAnyRef
            ? WithheldFindingReasons.ProvenanceHoldEmission
            : WithheldFindingReasons.ProseOnlyEmission;
    }
}
