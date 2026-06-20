using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Applies enforcement-tier classification to all agent findings on a result.
/// </summary>
public static class AgentResultFindingEnforcementTierApplier
{
    /// <summary>Classifies each finding on <paramref name="result" />.</summary>
    public static void Apply(AgentResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        foreach (ArchitectureFinding finding in result.Findings)
            FindingEnforcementTierClassifier.ApplyToArchitectureFinding(finding);
    }
}
