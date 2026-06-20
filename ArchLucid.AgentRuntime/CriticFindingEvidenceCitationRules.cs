using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

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
    public static bool HasConcreteEvidenceCitation(IReadOnlyList<string> evidenceRefs) =>
        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(evidenceRefs);
}
