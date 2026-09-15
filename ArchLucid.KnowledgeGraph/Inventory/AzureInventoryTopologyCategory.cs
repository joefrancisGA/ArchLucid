namespace ArchLucid.KnowledgeGraph.Inventory;

/// <summary>
///     Maps Azure ARM resource types to <see cref="GraphTopologyCategories" /> for inventory graphs and Mermaid compile.
///     Microsoft.Network/* types use the provider prefix — not <c>Contains("/network")</c>, which misses VNets and subnets.
/// </summary>
public static class AzureInventoryTopologyCategory
{
    private const string MicrosoftNetworkProviderPrefix = "Microsoft.Network/";
    private const string DataFactoryProviderPrefix = "Microsoft.DataFactory/";
    private const string SynapseProviderPrefix = "Microsoft.Synapse/";

    public static string Resolve(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return GraphTopologyCategories.Compute;
        }

        if (IsMicrosoftNetworkProviderType(resourceType))
        {
            return GraphTopologyCategories.Network;
        }

        if (resourceType.Contains("/storage", StringComparison.OrdinalIgnoreCase))
        {
            return GraphTopologyCategories.Storage;
        }

        if (resourceType.Contains("/compute", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("sites", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("serverfarms", StringComparison.OrdinalIgnoreCase))
        {
            return GraphTopologyCategories.Compute;
        }

        if (resourceType.Contains("/sql", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("/documentdb", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("/dbfor", StringComparison.OrdinalIgnoreCase)
            || IsDataIntegrationArmType(resourceType))
        {
            return GraphTopologyCategories.Data;
        }

        if (resourceType.Contains("managedidentity", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("authorization", StringComparison.OrdinalIgnoreCase))
        {
            return GraphTopologyCategories.Identity;
        }

        return GraphTopologyCategories.Compute;
    }

    public static bool IsMicrosoftNetworkProviderType(string resourceType)
    {
        return resourceType.Contains(MicrosoftNetworkProviderPrefix, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Data Factory and Synapse move data between stores, so they belong on the Data diagram
    ///     with the databases they feed rather than defaulting to the compute bucket.
    /// </summary>
    public static bool IsDataIntegrationArmType(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.StartsWith(DataFactoryProviderPrefix, StringComparison.OrdinalIgnoreCase)
            || resourceType.StartsWith(SynapseProviderPrefix, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsSubnetArmType(string armType)
    {
        if (string.IsNullOrWhiteSpace(armType))
        {
            return false;
        }

        return armType.Contains("/virtualNetworks/subnets", StringComparison.OrdinalIgnoreCase)
            || armType.EndsWith("/subnets", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsVirtualNetworkArmType(string armType)
    {
        if (string.IsNullOrWhiteSpace(armType))
        {
            return false;
        }

        // Child types (subnets, peerings) also contain "/virtualNetworks"; Executive mode
        // must keep only the VNet itself so peering objects do not render as extra VNets.
        return armType.EndsWith("/virtualNetworks", StringComparison.OrdinalIgnoreCase);
    }
}
