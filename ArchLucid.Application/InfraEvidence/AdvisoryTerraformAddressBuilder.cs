using System.Security.Cryptography;
using System.Text;

using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public static class AdvisoryTerraformAddressBuilder
{
    public static AdvisoryTerraformAddressInfo Build(AzureInventoryResourceRecord resource)
    {
        ArgumentNullException.ThrowIfNull(resource);

        string terraformType = MapResourceType(resource.ResourceType);
        string terraformName = BuildTerraformName(resource);
        string category = MapCategoryFolder(resource.ResourceType);

        return new AdvisoryTerraformAddressInfo
        {
            TerraformResourceType = terraformType,
            TerraformName = terraformName,
            TerraformAddress = $"azurerm_{terraformType.Split('_').Last()}.{terraformName}",
            CategoryFolder = category,
        };
    }

    private static string MapResourceType(string resourceType)
    {
        if (resourceType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase))
            return "azurerm_virtual_machine";

        if (resourceType.Contains("storageAccounts", StringComparison.OrdinalIgnoreCase))
            return "azurerm_storage_account";

        if (resourceType.Contains("virtualNetworks", StringComparison.OrdinalIgnoreCase))
            return "azurerm_virtual_network";

        if (resourceType.Contains("publicIPAddresses", StringComparison.OrdinalIgnoreCase))
            return "azurerm_public_ip";

        if (resourceType.Contains("keyVaults", StringComparison.OrdinalIgnoreCase))
            return "azurerm_key_vault";

        if (resourceType.Contains("managedClusters", StringComparison.OrdinalIgnoreCase))
            return "azurerm_kubernetes_cluster";

        return "azurerm_resource_group";
    }

    private static string MapCategoryFolder(string resourceType)
    {
        if (resourceType.Contains("Network", StringComparison.OrdinalIgnoreCase))
            return "network";

        if (resourceType.Contains("Compute", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("ContainerService", StringComparison.OrdinalIgnoreCase))
            return "compute";

        if (resourceType.Contains("Storage", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Sql", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("DocumentDB", StringComparison.OrdinalIgnoreCase))
            return "data";

        if (resourceType.Contains("ManagedIdentity", StringComparison.OrdinalIgnoreCase))
            return "identity";

        if (resourceType.Contains("KeyVault", StringComparison.OrdinalIgnoreCase))
            return "security";

        if (resourceType.Contains("OperationalInsights", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("insights", StringComparison.OrdinalIgnoreCase))
            return "monitoring";

        return "other";
    }

    private static string BuildTerraformName(AzureInventoryResourceRecord resource)
    {
        string name = resource.AzureResourceId.Split('/').Last();

        StringBuilder builder = new();

        foreach (char ch in name)
        {
            if (char.IsLetterOrDigit(ch))
                builder.Append(char.ToLowerInvariant(ch));
            else
                builder.Append('_');
        }

        string sanitized = builder.ToString().Trim('_');

        if (string.IsNullOrWhiteSpace(sanitized))
            sanitized = "resource";

        return sanitized;
    }
}

public sealed class AdvisoryTerraformAddressInfo
{
    public string TerraformResourceType
    {
        get;
        init;
    } = string.Empty;

    public string TerraformName
    {
        get;
        init;
    } = string.Empty;

    public string TerraformAddress
    {
        get;
        init;
    } = string.Empty;

    public string CategoryFolder
    {
        get;
        init;
    } = string.Empty;
}

public static class AdvisoryTerraformContentHasher
{
    public static byte[] Compute(IReadOnlyDictionary<string, string> files)
    {
        ArgumentNullException.ThrowIfNull(files);

        StringBuilder builder = new();

        foreach (KeyValuePair<string, string> file in files.OrderBy(f => f.Key, StringComparer.Ordinal))
        {
            builder.Append(file.Key)
                .Append('\n')
                .Append(file.Value)
                .Append('\n');
        }

        return SHA256.HashData(Encoding.UTF8.GetBytes(builder.ToString()));
    }
}
