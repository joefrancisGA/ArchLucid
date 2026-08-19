using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Maps common Azure resource provider types to costing <see cref="RuntimePlatform"/> values.</summary>
public static class AzureArmResourceCostMapper
{
    /// <summary>Infers costing platform from Azure ARM <c>resourceType</c> when recognizable.</summary>
    public static RuntimePlatform? TryInferPlatform(string? armResourceType)
    {
        if (string.IsNullOrWhiteSpace(armResourceType))
            return null;

        ReadOnlySpan<char> t = armResourceType.AsSpan().Trim();

        if (t.Equals("Microsoft.Compute/virtualMachines".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.Vm;

        if (t.Equals("Microsoft.Web/sites".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.AppService;

        if (t.Equals("Microsoft.Web/serverFarms".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.AppService;

        if (t.Equals("Microsoft.ContainerService/managedClusters".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.Aks;

        if (t.StartsWith("Microsoft.Sql/servers/databases".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.SqlServer;

        if (t.StartsWith("Microsoft.Sql/managedInstances".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.SqlServer;

        if (t.Equals("Microsoft.Storage/storageAccounts".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.BlobStorage;

        if (t.Equals("Microsoft.Cache/redis".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.Redis;

        if (t.Equals("Microsoft.KeyVault/vaults".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.KeyVault;

        if (t.Equals("Microsoft.Search/searchServices".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.AzureAiSearch;

        if (t.Equals("Microsoft.CognitiveServices/accounts".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.AzureOpenAi;

        if (t.Equals("microsoft.insights/components".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return null;

        return null;
    }
}
