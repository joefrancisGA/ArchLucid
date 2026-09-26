using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Analysis;

public static partial class DeclarationSecurityBaselineClassifier
{
    private static bool IsWeakSqlPosture(IReadOnlyDictionary<string, string> properties)
    {
        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion,
                out _,
                out string? minimumTlsVersion)
            && !string.IsNullOrWhiteSpace(minimumTlsVersion)
            && !string.Equals(minimumTlsVersion, "1.2", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(minimumTlsVersion, "1.3", StringComparison.OrdinalIgnoreCase))
            return true;

        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled,
                out _,
                out string? sslEnforcement)
            && IsFalsy(sslEnforcement))
            return true;

        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                out _,
                out string? sqlPublicAccess)
            && IsEnabledToken(sqlPublicAccess))
        {
            if (TryGetProperty(properties, "terraformType", out string? terraformType)
                && IsSqlResourceType(terraformType!))
                return true;

            if (TryGetProperty(properties, "resourceType", out string? resourceType)
                && IsSqlResourceType(resourceType!))
                return true;
        }

        return false;
    }

    private static bool IsSqlResourceType(string resourceType)
    {
        string normalized = resourceType.ToLowerInvariant();

        foreach (string part in normalized.Split(['/', '.', '_', ':'], StringSplitOptions.RemoveEmptyEntries))
        {
            if (part.Equals("sql", StringComparison.Ordinal)
                || part.Equals("mssql", StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }
}
