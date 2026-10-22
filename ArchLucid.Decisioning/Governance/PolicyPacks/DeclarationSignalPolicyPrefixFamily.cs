namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>
///     Rule-id prefixes that mean the tenant opted into a declaration-relevant bundled framework.
///     Used when the filtered pack contains keys like <c>soc2-001</c> that are not themselves mapped to a theme.
/// </summary>
public static class DeclarationSignalPolicyPrefixFamily
{
    /// <summary>Prefix tokens must match bundled <c>*-rules-v1.json</c> ids (ordinal ignore-case, hyphen suffix).</summary>
    public static IReadOnlyList<string> DeclarationRelevantPrefixes { get; } =
        [
            "soc2",
            "gdpr",
            "hipaa",
            "iso27001",
            "pci",
            "zta",
            "cis-az",
            "cis-aws",
            "cis-gcp",
            "sec-base",
            "aks",
            "eks",
            "gke",
        ];

    /// <summary>
    ///     Returns true when <paramref name="ruleId" /> starts with a known prefix followed by <c>-</c>.
    ///     Does not match partial tokens (e.g. <c>iso</c> does not match <c>iso27001-001</c>).
    /// </summary>
    public static bool RuleIdMatchesFamily(string ruleId)
    {
        if (string.IsNullOrWhiteSpace(ruleId))
            return false;

        foreach (string prefix in DeclarationRelevantPrefixes)
        {
            if (ruleId.Length > prefix.Length
                && ruleId.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
                && ruleId[prefix.Length] == '-')
                return true;
        }

        return false;
    }

    public static bool ActiveSetUsesDeclarationPrefixFamily(IReadOnlySet<string> activeRuleIds)
    {
        ArgumentNullException.ThrowIfNull(activeRuleIds);

        foreach (string ruleId in activeRuleIds)
        {
            if (RuleIdMatchesFamily(ruleId))
                return true;
        }

        return false;
    }
}
