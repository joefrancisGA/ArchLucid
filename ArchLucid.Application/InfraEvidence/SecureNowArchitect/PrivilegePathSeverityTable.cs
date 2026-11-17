using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>
///     Documented severity table for privilege-path findings (SA-03).
///     Production scope tagging is never invented — absence keeps business consequence Unknown.
/// </summary>
public static class PrivilegePathSeverityTable
{
    public static PrivilegePathSeverityResult Resolve(
        string? roleName,
        bool hasInsufficientEvidenceHop,
        bool scopeTaggedProduction)
    {
        if (hasInsufficientEvidenceHop)
        {
            return new PrivilegePathSeverityResult
            {
                Severity = string.Empty,
                BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
                BlastRadius = FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
            };
        }

        string normalizedRole = roleName?.Trim() ?? string.Empty;

        if (normalizedRole.Length == 0)
        {
            return new PrivilegePathSeverityResult
            {
                Severity = string.Empty,
                BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
                BlastRadius = FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
            };
        }

        string severity = ResolveBaseSeverity(normalizedRole);

        if (scopeTaggedProduction && IsElevatedRole(normalizedRole))
        {
            severity = "Critical";
        }

        return new PrivilegePathSeverityResult
        {
            Severity = severity,
            BusinessCriticality = scopeTaggedProduction
                ? "Production"
                : FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
            BlastRadius = scopeTaggedProduction && IsElevatedRole(normalizedRole)
                ? "Elevated"
                : FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
        };
    }

    private static string ResolveBaseSeverity(string roleName)
    {
        if (roleName.Equals("Owner", StringComparison.OrdinalIgnoreCase)
            || roleName.Contains("User Access Administrator", StringComparison.OrdinalIgnoreCase))
        {
            return "Critical";
        }

        if (roleName.Equals("Contributor", StringComparison.OrdinalIgnoreCase))
        {
            return "High";
        }

        if (roleName.Contains("Storage Blob Data Contributor", StringComparison.OrdinalIgnoreCase))
        {
            return "High";
        }

        if (roleName.Contains("Storage Blob Data Reader", StringComparison.OrdinalIgnoreCase)
            || roleName.Equals("Reader", StringComparison.OrdinalIgnoreCase)
            || roleName.Contains("Key Vault Secrets User", StringComparison.OrdinalIgnoreCase))
        {
            return "Medium";
        }

        return string.Empty;
    }

    private static bool IsElevatedRole(string roleName) =>
        roleName.Equals("Owner", StringComparison.OrdinalIgnoreCase)
        || roleName.Equals("Contributor", StringComparison.OrdinalIgnoreCase)
        || roleName.Contains("User Access Administrator", StringComparison.OrdinalIgnoreCase);
}

public sealed class PrivilegePathSeverityResult
{
    public string Severity
    {
        get;
        init;
    } = "Medium";

    public string BusinessCriticality
    {
        get;
        init;
    } = "Unknown";

    public string BlastRadius
    {
        get;
        init;
    } = "Unknown";
}
