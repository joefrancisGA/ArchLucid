namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Resolves Databricks workspace VNet injection subnet ARM ids from flattened properties (AX-DE-16).
/// </summary>
public static class AzureInventoryDatabricksSubnetResolver
{
    public static string? TryResolvePrivateSubnetId(
        string? virtualNetworkId,
        string? privateSubnetName)
    {
        if (string.IsNullOrWhiteSpace(virtualNetworkId) || string.IsNullOrWhiteSpace(privateSubnetName))
        {
            return null;
        }

        string trimmedVnetId = virtualNetworkId.Trim().TrimEnd('/');
        string trimmedSubnetName = privateSubnetName.Trim();

        return $"{trimmedVnetId}/subnets/{trimmedSubnetName}";
    }
}
