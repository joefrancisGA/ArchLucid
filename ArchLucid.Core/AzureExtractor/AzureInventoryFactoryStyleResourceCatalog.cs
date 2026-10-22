namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Identifies ARM resources that expose ADF-style child collections (factories and Synapse workspaces).
/// </summary>
public static class AzureInventoryFactoryStyleResourceCatalog
{
    public const string DataFactoryResourceType = "Microsoft.DataFactory/factories";

    public const string SynapseWorkspaceResourceType = "Microsoft.Synapse/workspaces";

    public static bool IsFactoryStyleResourceType(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.Equals(DataFactoryResourceType, StringComparison.OrdinalIgnoreCase)
               || resourceType.Equals(SynapseWorkspaceResourceType, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsSynapseWorkspaceResourceType(string? resourceType)
    {
        return !string.IsNullOrWhiteSpace(resourceType)
               && resourceType.Equals(SynapseWorkspaceResourceType, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsSynapseWorkspaceArmId(string? armResourceId)
    {
        if (string.IsNullOrWhiteSpace(armResourceId))
        {
            return false;
        }

        return armResourceId.Contains("/providers/Microsoft.Synapse/workspaces/", StringComparison.OrdinalIgnoreCase);
    }
}
