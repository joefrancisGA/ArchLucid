using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Analysis;

public static partial class DeclarationSecurityBaselineClassifier
{
    private static bool IsHttpsOnlyDisabled(IReadOnlyDictionary<string, string> properties)
    {
        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.HttpsOnly,
                out _,
                out string? httpsOnly)
            && IsFalsy(httpsOnly))
            return true;

        return false;
    }
}
