namespace ArchLucid.Core.Findings;

/// <summary>Classifies persisted findings for insight-density treatment (TB-2228).</summary>
public static class InsightDensityFindingSourceClassifier
{
    private const string AgentArchitectureFindingTypePrefix = "AgentArchitectureFinding-";

    public const string InsightGeneratorFindingType = "InsightGeneratorFinding";

    /// <summary>
    ///     Agent-emitted and insight-generator findings may be demoted when generic; typed engine findings use the
    ///     demotion predicate without this short-circuit.
    /// </summary>
    public static bool IsAgentArchitectureFinding(string? findingType)
    {
        if (IsInsightGeneratorFinding(findingType))
        {
            return true;
        }

        return (findingType ?? string.Empty)
            .StartsWith(AgentArchitectureFindingTypePrefix, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsInsightGeneratorFinding(string? findingType) =>
        string.Equals(findingType, InsightGeneratorFindingType, StringComparison.OrdinalIgnoreCase);
}
