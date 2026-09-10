namespace ArchLucid.Core.InfraEvidence;

/// <summary>Derived data-plane permissions emitted from allowlisted built-in Azure roles (SA-02).</summary>
public enum AzureInventoryDerivedDataPlanePermission
{
    None = 0,
    Read = 1,
    Write = 2,
    ReadAndWrite = 3,
}

/// <summary>
///     Maps a resolved built-in role name to derived CAN_READ / CAN_WRITE edges.
///     Unknown roles return <see cref="AzureInventoryDerivedDataPlanePermission.None" /> — never guess.
/// </summary>
public static class AzureInventoryRbacDataPlaneRoleMap
{
    public static AzureInventoryDerivedDataPlanePermission Resolve(string? roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return AzureInventoryDerivedDataPlanePermission.None;
        }

        string normalized = roleName.Trim();

        if (normalized.Equals("Reader", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("Storage Blob Data Reader", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("Key Vault Secrets User", StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryDerivedDataPlanePermission.Read;
        }

        if (normalized.Equals("Contributor", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("Owner", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("Storage Blob Data Contributor", StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryDerivedDataPlanePermission.Write;
        }

        return AzureInventoryDerivedDataPlanePermission.None;
    }
}
