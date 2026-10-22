namespace ArchLucid.Core.AzureExtractor;

/// <summary>Read-only ARM type catalog for Azure Virtual Desktop diagram isolation (NR-06).</summary>
public static class InventoryDiagramAvdResourceMapping
{
    public static IReadOnlyList<InventoryDiagramAvdResourceMappingEntry> DesktopVirtualizationArmTypes =>
        DesktopVirtualizationCatalog;

    public static IReadOnlyList<string> ExclusiveSupportingArmTypePrefixes =>
        ExclusiveSupportingPrefixes;

    private static readonly InventoryDiagramAvdResourceMappingEntry[] DesktopVirtualizationCatalog =
    [
        new("Microsoft.DesktopVirtualization/hostPools", InventoryDiagramAvdCategory.HostPool),
        new("Microsoft.DesktopVirtualization/applicationGroups", InventoryDiagramAvdCategory.ApplicationGroup),
        new("Microsoft.DesktopVirtualization/workspaces", InventoryDiagramAvdCategory.Workspace),
        new("Microsoft.DesktopVirtualization/scalingPlans", InventoryDiagramAvdCategory.ScalingPlan),
    ];

    private static readonly string[] ExclusiveSupportingPrefixes =
    [
        "Microsoft.Storage/storageAccounts",
        "Microsoft.KeyVault/vaults",
        "Microsoft.Network/",
        "Microsoft.ManagedIdentity/",
    ];

    public const string DesktopVirtualizationProviderPrefix = "Microsoft.DesktopVirtualization/";

    public const string SessionHostArmIdSegment = "/sessionHosts/";

    public const string CollapsedBoundaryLabel = "Azure Virtual Desktop";

    public const string CollapsedBoundaryNodeIdPrefix = "avd-boundary-";
}
