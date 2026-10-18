namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Closed connection-posture sentences for types that were falling through to Unknown (NR-44–NR-46).
/// </summary>
public static class InventoryDiagramConnectionPostureCatalog
{
    public const string DataFactoryNoStoredLinkDetail = "No stored Data Factory link yet.";

    public const string LogicAppConnectionNotCitedDetail =
        "No workflow in this snapshot cites this connection.";

    public const string PostureNotModeledDetail =
        "Connection posture is not modeled for this resource type.";

    public static bool IsUnmodeledConnectionPosture(string? armResourceType)
    {
        if (string.IsNullOrWhiteSpace(armResourceType))
        {
            return false;
        }

        return armResourceType.Equals("Microsoft.Insights/components", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.ApiManagement/service", StringComparison.OrdinalIgnoreCase);
    }
}
