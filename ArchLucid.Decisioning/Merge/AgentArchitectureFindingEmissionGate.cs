using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Merge;

/// <summary>
///     TB-2222: strips prose-only agent findings and gates governance lift to typed emission paths.
/// </summary>
public static class AgentArchitectureFindingEmissionGate
{
    public static bool HasTypedEmission(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.Classification == FindingClassification.ChecklistCoverage)
            return true;

        if (!string.IsNullOrWhiteSpace(finding.PolicyRuleId))
            return true;

        if (finding.EvidenceRefs is { Count: > 0 } refs && refs.Any(static r => !string.IsNullOrWhiteSpace(r)))
            return true;

        return false;
    }

    public static void ApplyToResults(IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(results);

        foreach (AgentResult result in results)
        {
            if (result.Findings is not { Count: > 0 } findings)
                continue;

            List<ArchitectureFinding> retained = findings.Where(HasTypedEmission).ToList();
            result.Findings = retained;
        }
    }
}
