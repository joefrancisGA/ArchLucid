namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Closed connection-posture sentences for types that were falling through to Unknown (NR-44–NR-50).
/// </summary>
public static class InventoryDiagramConnectionPostureCatalog
{
    public const string DataFactoryNoStoredLinkDetail = "No stored Data Factory link yet.";

    public const string LogicAppConnectionNotCitedDetail =
        "No workflow in this snapshot cites this connection.";

    public const string PrivateLinkScopeNoScopedResourceDetail =
        "No stored scoped resource for this private link scope.";

    public const string NatGatewayNoStoredSubnetDetail = "No stored subnet for this NAT gateway.";

    public const string AccessConnectorNoWorkspaceCitationDetail =
        "No stored Databricks workspace cites this access connector.";

    public const string PostureNotModeledDetail =
        "Connection posture is not modeled for this resource type.";

    public static bool IsUnmodeledConnectionPosture(string? armResourceType)
    {
        if (string.IsNullOrWhiteSpace(armResourceType))
        {
            return false;
        }

        return armResourceType.Equals("Microsoft.Insights/components", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.ApiManagement/service", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Dashboard/grafana", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Compute/galleries", StringComparison.OrdinalIgnoreCase);
    }
}
