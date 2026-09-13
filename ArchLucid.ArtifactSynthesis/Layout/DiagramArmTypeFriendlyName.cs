namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>
/// Turns ARM types such as <c>Microsoft.Compute/virtualMachines</c> into a short phrase for diagram captions.
/// </summary>
public static class DiagramArmTypeFriendlyName
{
    private static readonly Dictionary<string, string> KnownFullTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Microsoft.Compute/virtualMachines"] = "Virtual machine",
        ["Microsoft.Compute/virtualMachineScaleSets"] = "VM scale set",
        ["Microsoft.Compute/disks"] = "Disk",
        ["Microsoft.Network/virtualNetworks"] = "Virtual network",
        ["Microsoft.Network/networkInterfaces"] = "Network interface",
        ["Microsoft.Network/networkSecurityGroups"] = "Network security group",
        ["Microsoft.Network/publicIPAddresses"] = "Public IP",
        ["Microsoft.Network/loadBalancers"] = "Load balancer",
        ["Microsoft.Sql/servers"] = "SQL server",
        ["Microsoft.Sql/servers/databases"] = "SQL database",
        ["Microsoft.Sql/managedInstances"] = "SQL managed instance",
        ["Microsoft.Storage/storageAccounts"] = "Storage account",
        ["Microsoft.KeyVault/vaults"] = "Key vault",
        ["Microsoft.Web/sites"] = "App Service",
        ["Microsoft.Web/serverFarms"] = "App Service plan",
        ["Microsoft.DocumentDB/databaseAccounts"] = "Cosmos DB",
        ["Microsoft.Cache/Redis"] = "Redis cache",
        ["Microsoft.ContainerService/managedClusters"] = "Kubernetes cluster",
        ["Microsoft.DBforPostgreSQL/flexibleServers"] = "PostgreSQL",
        ["Microsoft.DBforPostgreSQL/servers"] = "PostgreSQL",
        ["Microsoft.DBforMySQL/flexibleServers"] = "MySQL",
        ["Microsoft.DBforMySQL/servers"] = "MySQL",
    };

    public static string? TryFormat(string? armType)
    {
        if (string.IsNullOrWhiteSpace(armType))
        {
            return null;
        }

        string trimmed = armType.Trim();

        if (KnownFullTypes.TryGetValue(trimmed, out string? known))
        {
            return known;
        }

        string lastSegment = trimmed
            .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .LastOrDefault() ?? trimmed;

        return SplitCamelCase(lastSegment);
    }

    private static string SplitCamelCase(string lastSegment)
    {
        if (string.IsNullOrWhiteSpace(lastSegment))
        {
            return lastSegment;
        }

        List<char> characters = [];

        for (int index = 0; index < lastSegment.Length; index++)
        {
            char current = lastSegment[index];

            if (index > 0 && char.IsUpper(current) && !char.IsUpper(lastSegment[index - 1]))
            {
                characters.Add(' ');
            }

            characters.Add(index == 0 ? char.ToUpperInvariant(current) : char.ToLowerInvariant(current));
        }

        return new string(characters.ToArray());
    }
}
