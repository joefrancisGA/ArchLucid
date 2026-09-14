namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     ARM resource types omitted from inventory lists, resource counts, and topology node materialization.
///     Collectors may still read these rows to derive companion association edges before filtering them out.
/// </summary>
public static class AzureInventoryNeverShowArmTypes
{
    public static readonly string[] CatalogArmTypes =
    [
        "Microsoft.Network/privateDnsZones/virtualNetworkLinks",
        "Microsoft.Network/dnsForwardingRulesets/virtualNetworkLinks",
    ];

    private static readonly string[] LastSegments =
    [
        "virtualnetworklinks",
    ];

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
}
