using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Ensures Critic findings without concrete evidence citations are labeled Low confidence so operators
///     know to verify them manually before trusting the golden manifest.
/// </summary>
public static class CriticFindingConfidenceNormalizer
{
    /// <summary>
    ///     Applies confidence rules to parsed Critic output before persistence.
    /// </summary>
    public static void Apply(AgentResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        if (result.AgentType != AgentType.Critic)
            return;

        foreach (ArchitectureFinding finding in result.Findings)
        {
            if (HasConcreteEvidenceCitation(finding))
                continue;

            finding.ConfidenceLevel = FindingConfidenceLevel.Low;
        }
    }

    private static bool HasConcreteEvidenceCitation(ArchitectureFinding finding)
    {
        if (finding.EvidenceRefs.Count == 0)
            return false;

        foreach (string rawRef in finding.EvidenceRefs)
        {
            if (string.IsNullOrWhiteSpace(rawRef))
                continue;

            string normalized = rawRef.Trim();

            if (IsGenericEvidenceRef(normalized))
                continue;

            return true;
        }

        return false;
    }

    private static bool IsGenericEvidenceRef(string normalized)
    {
        return normalized.Equals("request", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("critic-checklist", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("architecture-request", StringComparison.OrdinalIgnoreCase);
    }
}
