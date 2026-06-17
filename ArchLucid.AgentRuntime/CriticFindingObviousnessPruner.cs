using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Removes or downgrades Critic findings that fail the novelty check — generic checklist advice with no
///     architecture-specific anchor from the uploaded evidence package.
/// </summary>
public static class CriticFindingObviousnessPruner
{
    /// <summary>
    ///     Applies obviousness penalties to parsed Critic output before persistence.
    /// </summary>
    public static void Apply(AgentResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        if (result.AgentType != AgentType.Critic)
            return;

        if (result.Findings.Count == 0)
            return;

        List<ArchitectureFinding> retained = new(result.Findings.Count);

        foreach (ArchitectureFinding finding in result.Findings)
        {
            if (ShouldRemove(finding))
                continue;

            if (ShouldDowngradeToInfo(finding))
            {
                finding.Severity = FindingSeverity.Info;
                finding.ConfidenceLevel = FindingConfidenceLevel.Low;
            }

            retained.Add(finding);
        }

        result.Findings.Clear();
        result.Findings.AddRange(retained);
    }

    private static bool ShouldRemove(ArchitectureFinding finding)
    {
        if (!CriticFindingObviousnessPatterns.IsObviousGenericAdvice(finding.Message))
            return false;

        if (CriticFindingObviousnessPatterns.HasArchitectureSpecificAnchor(finding.Message, finding.EvidenceRefs))
            return false;

        return true;
    }

    private static bool ShouldDowngradeToInfo(ArchitectureFinding finding)
    {
        if (finding.Severity == FindingSeverity.Info)
            return false;

        if (!CriticFindingObviousnessPatterns.IsObviousGenericAdvice(finding.Message))
            return false;

        return CriticFindingObviousnessPatterns.HasArchitectureSpecificAnchor(finding.Message, finding.EvidenceRefs);
    }
}
