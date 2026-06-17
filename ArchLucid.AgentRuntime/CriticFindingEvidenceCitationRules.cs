using ArchLucid.Contracts.Findings;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Shared rules for whether a Critic finding cites concrete uploaded architecture evidence.
/// </summary>
public static class CriticFindingEvidenceCitationRules
{
    /// <summary>
    ///     Returns true when at least one evidence ref points to a specific artifact, document line, or topology element.
    /// </summary>
    public static bool HasConcreteEvidenceCitation(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        return HasConcreteEvidenceCitation(finding.EvidenceRefs);
    }

    /// <summary>
    ///     Returns true when at least one evidence ref points to a specific artifact, document line, or topology element.
    /// </summary>
    public static bool HasConcreteEvidenceCitation(IReadOnlyList<string> evidenceRefs)
    {
        ArgumentNullException.ThrowIfNull(evidenceRefs);

        if (evidenceRefs.Count == 0)
            return false;

        foreach (string rawRef in evidenceRefs)
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
