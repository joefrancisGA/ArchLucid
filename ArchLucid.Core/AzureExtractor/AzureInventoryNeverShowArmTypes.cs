namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     ARM resource types omitted from inventory lists, resource counts, topology node materialization,
///     inventory diagram rendering, and drift comparison. Collectors may still read these rows to derive
///     companion association edges before filtering them out.
/// </summary>
public static class AzureInventoryNeverShowArmTypes
{
    public const string DiagramCollapseKind = "AlwaysDisposeArmType";

    public static readonly string[] CatalogArmTypes =
    [
        "Microsoft.Portal/dashboards",
        "Microsoft.OperationalInsights/workspaces",
        "Microsoft.Insights/activityLogAlerts",
        "Microsoft.OperationsManagement/solutions",
        "Microsoft.Network/dnszones",
        "Microsoft.Network/privateDnsZones",
        "Microsoft.Network/dnsResolvers",
        "Microsoft.Network/firewallPolicies",
        "Microsoft.Network/networkIntentPolicies",
        "Microsoft.ManagedIdentity/userAssignedIdentities",
        "Microsoft.Automation/automationAccounts",
        "Microsoft.Automation/automationAccounts/runbooks",
        "Microsoft.Compute/virtualMachines/extensions",
        "Microsoft.Compute/virtualMachineScaleSets/extensions",
        "Microsoft.Compute/sshPublicKeys",
        "Microsoft.HybridCompute/machines/extensions",
        "Microsoft.Maintenance/maintenanceConfigurations",
        "Microsoft.Maintenance/configurationAssignments",
        "Microsoft.Network/privateDnsZones/virtualNetworkLinks",
        "Microsoft.Network/dnsForwardingRulesets/virtualNetworkLinks",
    ];

    private static readonly string[] LastSegments =
    [
        "dashboards",
        "workspaces",
        "activitylogalerts",
        "solutions",
        "extensions",
        "sshpublickeys",
        "dnssettings",
        "dnszones",
        "privatednszones",
        "dnsresolvers",
        "firewallpolicies",
        "networkintentpolicies",
        "userassignedidentities",
        "automationaccounts",
        "runbooks",
        "versions",
        "virtualnetworklinks",
        "maintenanceconfigurations",
        "configurationassignments",
    ];

    public static readonly string[] ResourceTypeLastSegmentSuffixes = LastSegments;

    public static bool ShouldOmitFromInventory(string? armType)
    {
        if (string.IsNullOrWhiteSpace(armType))
        {
            return false;
        }

        if (CatalogArmTypes.Contains(armType, StringComparer.OrdinalIgnoreCase))
        {
            return true;
        }

        string lastSegment = armType
            .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .LastOrDefault() ?? string.Empty;

        return LastSegments.Contains(lastSegment, StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     ARM ids are <c>.../{type}/{name}</c>. Drift Type uses the segment immediately before the name,
    ///     so omit checks must use that type last-segment when ResourceType is missing or not ARM-shaped.
    /// </summary>
    public static bool ShouldOmitAzureResourceId(string? azureResourceId)
    {
        if (string.IsNullOrWhiteSpace(azureResourceId))
        {
            return false;
        }

        string[] segments = azureResourceId.Split(
            '/',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (segments.Length < 2)
        {
            return false;
        }

        string lastTypeSegment = segments[^2];
        return LastSegments.Contains(lastTypeSegment, StringComparer.OrdinalIgnoreCase);
    }

    public static bool ShouldOmitResource(
        string? resourceType,
        string? azureResourceId,
        IReadOnlySet<string>? privateLinkOnlyNicArmIds = null)
    {
        if (ShouldOmitFromInventory(resourceType) || ShouldOmitAzureResourceId(azureResourceId))
        {
            return true;
        }

        if (!AzureInventoryPrivateLinkOnlyNicCatalog.IsNetworkInterface(resourceType, azureResourceId))
        {
            return false;
        }

        return AzureInventoryPrivateLinkOnlyNicCatalog.ShouldOmitNicArmId(azureResourceId, privateLinkOnlyNicArmIds);
    }
}
