namespace ArchLucid.Core.Findings;

/// <summary>Classifies persisted findings for insight-density treatment (TB-2228).</summary>
public static class InsightDensityFindingSourceClassifier
{
    private const string AgentArchitectureFindingTypePrefix = "AgentArchitectureFinding-";

    /// <summary>
    ///     Agent-emitted architecture findings may be demoted when generic; typed engine findings are never suppressed.
    /// </summary>
    public static bool IsAgentArchitectureFinding(string? findingType)
    {
        return (findingType ?? string.Empty)
            .StartsWith(AgentArchitectureFindingTypePrefix, StringComparison.OrdinalIgnoreCase);
    }
}
