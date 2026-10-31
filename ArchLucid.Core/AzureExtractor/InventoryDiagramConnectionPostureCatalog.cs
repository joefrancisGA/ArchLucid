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

    public const string VirtualMachineNoStoredSubnetPlacementDetail =
        "No subnet placement was stored.";

    public const string PostureNotModeledDetail =
        "Connection posture is not modeled for this resource type.";

    public const string AppInsightsNoWorkspaceDetail = "No Log Analytics workspace is linked in this snapshot.";

    public const string AppInsightsNoPrivateLinkScopeDetail =
        "No Azure Monitor private link scope scopes this component in this snapshot.";

    public const string ApiManagementNoSubnetDetail = "No integration subnet is stored for this API Management instance.";

    public const string ApiManagementNoPrivateEndpointDetail =
        "No private endpoint targets this API Management instance in this snapshot.";

    public static string FormatSendsTelemetryTo(string workspaceName)
    {
        return $"Sends telemetry to {workspaceName}.";
    }

    public static string FormatIntegratedWithSubnet(string subnetName)
    {
        return $"Integrated with subnet {subnetName}.";
    }

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
