using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
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
            if (CriticFindingEvidenceCitationRules.HasConcreteEvidenceCitation(finding))
                continue;

            finding.ConfidenceLevel = FindingConfidenceLevel.Low;
        }
    }
}
