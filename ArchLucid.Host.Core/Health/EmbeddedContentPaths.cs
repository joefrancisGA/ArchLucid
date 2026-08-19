namespace ArchLucid.Host.Core.Health;

/// <summary>Paths under <see cref="AppContext.BaseDirectory"/> for bundled policy/content files.</summary>
public static class EmbeddedContentPaths
{
    /// <summary>Default compliance rule pack loaded at startup by <c>RegisterDecisioningEngines</c>.</summary>
    public const string ComplianceRulePackRelativePath = "Compliance/RulePacks/default-compliance.rules.json";

    /// <summary>GA starter rule stubs merged with <see cref="ComplianceRulePackRelativePath" /> at runtime.</summary>
    public const string GaStarterComplianceRulePackRelativePath = "Compliance/RulePacks/ga-starter-compliance.rules.json";
}
