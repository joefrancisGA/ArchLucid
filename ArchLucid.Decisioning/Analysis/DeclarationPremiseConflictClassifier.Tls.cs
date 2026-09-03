using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Analysis;

public static partial class DeclarationPremiseConflictClassifier
{
    private static readonly string[] HttpsTlsIntentPhrases = ["https only","https-only","encryption in transit","tls 1.2","tls1.2","minimum tls","require https","ssl enforcement"];
    private static bool HttpsTlsIntentMatches(string n) => ContainsAnyPhrase(n, HttpsTlsIntentPhrases);
    private static bool TryGetHttpsTlsDeclarationProperty(IReadOnlyDictionary<string, string> properties, out string? propertyKey, out string? propertyValue)
    {
        propertyKey = null; propertyValue = null;
        if (DeclarationSecurityPropertyKeyResolver.TryGet(properties, DeclarationSecurityPropertyLogicalNames.HttpsOnly, out propertyKey, out propertyValue)) return true;
        if (DeclarationSecurityPropertyKeyResolver.TryGet(properties, DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion, out propertyKey, out propertyValue)) return true;
        if (DeclarationSecurityPropertyKeyResolver.TryGet(properties, DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled, out propertyKey, out propertyValue)) return true;
        return false;
    }
    private static bool HasWeakTlsProperty(IReadOnlyDictionary<string, string> properties) =>
        DeclarationSecurityPropertyKeyResolver.TryGet(properties, DeclarationSecurityPropertyLogicalNames.HttpsOnly, out _, out _)
        || DeclarationSecurityPropertyKeyResolver.TryGet(properties, DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion, out _, out _)
        || DeclarationSecurityPropertyKeyResolver.TryGet(properties, DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled, out _, out _);
}
