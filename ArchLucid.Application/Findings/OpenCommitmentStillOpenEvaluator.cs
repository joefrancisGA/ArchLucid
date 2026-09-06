using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>Re-checks declaration themes on the current graph node property bag.</summary>
public static class OpenCommitmentStillOpenEvaluator
{
    public static bool IsStillOpen(
        OpenCommitmentDeclarationTheme theme,
        IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        return theme switch
        {
            OpenCommitmentDeclarationTheme.PublicNetworkAccess => IsUnsafePublicNetworkAccess(properties),
            OpenCommitmentDeclarationTheme.HttpsOnly => IsHttpsOnlyDisabled(properties),
            _ => false,
        };
    }

    private static bool IsUnsafePublicNetworkAccess(IReadOnlyDictionary<string, string> properties)
    {
        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                out _,
                out string? publicNetworkAccess)
            && IsEnabledToken(publicNetworkAccess))
        {
            return true;
        }

        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess,
                out _,
                out string? blobPublicAccess)
            && IsTruthy(blobPublicAccess))
        {
            return true;
        }

        return false;
    }

    private static bool IsHttpsOnlyDisabled(IReadOnlyDictionary<string, string> properties)
    {
        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.HttpsOnly,
                out _,
                out string? httpsOnly)
            && IsFalsy(httpsOnly))
        {
            return true;
        }

        return false;
    }

    private static bool IsEnabledToken(string? value) =>
        string.Equals(value, "enabled", StringComparison.OrdinalIgnoreCase);

    private static bool IsTruthy(string? value) =>
        string.Equals(value, "true", StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, "allow", StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, "enabled", StringComparison.OrdinalIgnoreCase);

    private static bool IsFalsy(string? value) =>
        string.Equals(value, "false", StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, "disabled", StringComparison.OrdinalIgnoreCase);
}
