namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Maps inventoried ARM types to SecureNow data-flow stages when the type is present (AX-DE-16).
/// </summary>
public static class AzureInventoryDataFlowStageResolver
{
    public static AzureInventoryDataFlowStage? Resolve(string? resourceType, bool isExternalSource = false)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return null;
        }

        string normalized = resourceType.Trim();

        if (normalized.StartsWith("Microsoft.Databricks/", StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryDataFlowStage.Transform;
        }

        if (normalized.StartsWith("Microsoft.PowerBIDedicated/", StringComparison.OrdinalIgnoreCase)
            || normalized.StartsWith("Microsoft.Fabric/", StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryDataFlowStage.Consumer;
        }

        if (isExternalSource)
        {
            return AzureInventoryDataFlowStage.Source;
        }

        return null;
    }
}
