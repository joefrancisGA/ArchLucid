namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>
///     Gates declaration-security and declaration-premise-conflict findings against the tenant's
///     filtered compliance rule pack.
/// </summary>
public static class DeclarationSignalPolicyGate
{
    /// <summary>
    ///     Empty filtered pack fails closed. When the tenant speaks declaration vocabulary (mapped keys or
    ///     bundled framework prefixes such as soc2 / gdpr / cis-aws), only themes with a surviving mapped key emit.
    ///     Prefixes outside <see cref="DeclarationSignalPolicyPrefixFamily" /> (cost-opt, ai-gov, dora, otel, …) fail-open.
    /// </summary>
    public static bool ShouldEmitTheme(string theme, IReadOnlySet<string> activeRuleIds)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(theme);
        ArgumentNullException.ThrowIfNull(activeRuleIds);

        if (activeRuleIds.Count == 0)
            return false;

        if (!DeclarationSignalPolicyKeyMap.TenantUsesDeclarationVocabulary(activeRuleIds))
            return true;

        return DeclarationSignalPolicyKeyMap.IsThemeEnabled(theme, activeRuleIds);
    }

    public static string? TryGetPolicyRuleId(string theme, IReadOnlySet<string> activeRuleIds) =>
        DeclarationSignalPolicyKeyMap.TryGetFirstMappedRuleId(theme, activeRuleIds);

    public static bool PackIsKeyNarrowed(Compliance.Models.ComplianceRulePack full, Compliance.Models.ComplianceRulePack filtered)
    {
        ArgumentNullException.ThrowIfNull(full);
        ArgumentNullException.ThrowIfNull(filtered);

        return filtered.Rules.Count < full.Rules.Count;
    }
}
