using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>Public-network property detection reused for topology-security-drift (DX-64).</summary>
internal static class TopologySecurityPublicNetworkHeuristic
{
    public static bool HasUnsafePublicNetworkAccess(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

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

    private static bool IsEnabledToken(string? value) =>
        string.Equals(value, "enabled", StringComparison.OrdinalIgnoreCase);

    private static bool IsTruthy(string? value) =>
        string.Equals(value, "true", StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, "allow", StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, "enabled", StringComparison.OrdinalIgnoreCase);
}
