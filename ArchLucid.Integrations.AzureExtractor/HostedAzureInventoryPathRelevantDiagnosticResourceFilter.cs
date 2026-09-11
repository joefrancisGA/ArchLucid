namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Limits hosted diagnostic-setting GET fan-out to resource types referenced by SecureNow path engines.
/// </summary>
internal static class HostedAzureInventoryPathRelevantDiagnosticResourceFilter
{
    public static bool IsPathRelevant(string resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.Equals("Microsoft.Storage/storageAccounts", StringComparison.OrdinalIgnoreCase)
               || resourceType.Equals("Microsoft.KeyVault/vaults", StringComparison.OrdinalIgnoreCase)
               || resourceType.Equals("Microsoft.Network/networkSecurityGroups", StringComparison.OrdinalIgnoreCase)
               || resourceType.Equals("Microsoft.Sql/servers", StringComparison.OrdinalIgnoreCase);
    }
}
