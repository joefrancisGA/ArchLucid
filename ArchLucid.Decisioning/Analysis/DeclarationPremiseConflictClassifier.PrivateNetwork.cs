using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Analysis;

public static partial class DeclarationPremiseConflictClassifier
{
    private static readonly string[] PrivateNetworkIntentPhrases = ["private only","private-only","private endpoint","private network","no public access","deny public","disable public","block public","public access disabled","private link"];
    private static bool PrivateNetworkIntentMatches(string n) => ContainsAnyPhrase(n, PrivateNetworkIntentPhrases);
    private static bool TryGetPrivateNetworkDeclarationProperty(IReadOnlyDictionary<string, string> properties, out string? propertyKey, out string? propertyValue)
    {
        propertyKey = null; propertyValue = null;
        if (DeclarationSecurityPropertyKeyResolver.TryGet(properties, DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess, out propertyKey, out propertyValue)) return true;
        if (DeclarationSecurityPropertyKeyResolver.TryGet(properties, DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess, out propertyKey, out propertyValue)) return true;
        return false;
    }
    private static bool HasPublicNetworkProperty(IReadOnlyDictionary<string, string> properties) =>
        DeclarationSecurityPropertyKeyResolver.TryGet(properties, DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess, out _, out _)
        || DeclarationSecurityPropertyKeyResolver.TryGet(properties, DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess, out _, out _);
}
