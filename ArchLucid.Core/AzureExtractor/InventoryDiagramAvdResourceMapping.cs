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

    public const string CollapsedBoundaryEdgeLabel = "AVD resources omitted from this diagram.";

    public const string HostPoolNameNotStoredCaption = "Host pool name was not stored.";

    public const string HostPoolNameNotStored = "Host pool name was not stored.";

    public const string CollapsedBoundaryNodeIdPrefix = "avd-boundary-";

    public static string FormatHostPoolBoundaryLabel(string? hostPoolArmId)
    {
        if (string.IsNullOrWhiteSpace(hostPoolArmId) || hostPoolArmId.Equals("avd", StringComparison.OrdinalIgnoreCase))
        {
            return HostPoolNameNotStoredCaption;
        }

        const string hostPoolsSegment = "/hostPools/";
        int segmentIndex = hostPoolArmId.IndexOf(hostPoolsSegment, StringComparison.OrdinalIgnoreCase);

        if (segmentIndex < 0)
        {
            return HostPoolNameNotStoredCaption;
        }

        string afterSegment = hostPoolArmId[(segmentIndex + hostPoolsSegment.Length)..];
        int slashIndex = afterSegment.IndexOf('/', StringComparison.Ordinal);
        string hostPoolName = (slashIndex >= 0 ? afterSegment[..slashIndex] : afterSegment).Trim();

        return hostPoolName.Length > 0 ? hostPoolName : HostPoolNameNotStoredCaption;
    }

    public static string FormatOmittedAvdSummaryBoundaryLabel(int hostPoolCount, int sessionHostCount)
    {
        string hostPoolWord = hostPoolCount == 1 ? "host pool" : "host pools";
        string sessionHostWord = sessionHostCount == 1 ? "session host" : "session hosts";

        return $"{hostPoolCount} {hostPoolWord} and {sessionHostCount} {sessionHostWord} omitted from this diagram.";
    }
}
