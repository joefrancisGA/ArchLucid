using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Analysis;

public static partial class DeclarationPremiseConflictClassifier
{
    private static readonly string[] AdminIngressIntentPhrases = ["restricted ingress","restrict administrative","admin ingress","no ssh","block ssh","no rdp","block rdp","administrative access","deny internet ssh"];
    private static bool AdminIngressIntentMatches(string n) => ContainsAnyPhrase(n, AdminIngressIntentPhrases);
    private static bool TryGetAdminIngressDeclarationProperty(IReadOnlyDictionary<string, string> properties, out string? propertyKey, out string? propertyValue)
    {
        propertyKey = null; propertyValue = null;
        return DeclarationSecurityPropertyKeyResolver.TryGet(properties, DeclarationSecurityPropertyLogicalNames.IngressBlob, out propertyKey, out propertyValue);
    }
}
