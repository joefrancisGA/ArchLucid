namespace ArchLucid.Core.InfraEvidence;

/// <summary>Built-in Azure RBAC roles whose data-plane reach requires a named control-to-data conversion (book Ch. 4 §4.5).</summary>
public static class AzureInventoryControlPlaneBuiltinRoles
{
    public static bool IsContributorOrOwner(string? roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return false;
        }

        string normalized = roleName.Trim();

        return normalized.Equals("Contributor", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("Owner", StringComparison.OrdinalIgnoreCase);
    }
}
