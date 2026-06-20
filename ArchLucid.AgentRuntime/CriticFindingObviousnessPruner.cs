using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Removes or downgrades Critic findings that fail the novelty check — generic checklist advice with no
///     architecture-specific anchor from the uploaded evidence package.
/// </summary>
public static class CriticFindingObviousnessPruner
{
    /// <summary>
    ///     Applies obviousness penalties to parsed Critic output before persistence.
    ///     Generic advice is retained as <see cref="FindingEnforcementTier.Advisory" /> instead of removed.
    /// </summary>
    public static void Apply(AgentResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        if (result.AgentType != AgentType.Critic)
            return;

        if (result.Findings.Count == 0)
            return;

        foreach (ArchitectureFinding finding in result.Findings)
        {
            if (ShouldDowngradeToInfo(finding))
            {
                finding.Severity = FindingSeverity.Info;
                finding.ConfidenceLevel = FindingConfidenceLevel.Low;
            }

            FindingEnforcementTierClassifier.ApplyToArchitectureFinding(finding);
        }
    }

    private static bool ShouldDowngradeToInfo(ArchitectureFinding finding)
    {
        if (finding.Severity == FindingSeverity.Info)
            return false;

        if (!GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(finding.Message))
            return false;

        return GenericArchitectureAdvicePatterns.HasArchitectureSpecificAnchor(finding.Message, finding.EvidenceRefs);
    }
}
