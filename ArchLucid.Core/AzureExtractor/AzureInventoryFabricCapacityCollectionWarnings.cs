namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Manifest / completeness warning codes when Fabric capacity workspace assignment collection fails (NR-40).
/// </summary>
public static class AzureInventoryFabricCapacityCollectionWarnings
{
    public const string AssignmentsNotCollectedBase = "fabric-capacity-assignments-not-collected";

    public const string WorkspacesOutsideInventoryBase = "fabric-capacity-workspaces-outside-inventory";

    public const string ReasonInsufficientPermission = "insufficient-permission";

    public const string ReasonHttpError = "http-error";

    public const string ReasonError = "error";

    public const string ReasonUnavailable = "unavailable";

    public const string ReasonPartialEnumeration = "partial-enumeration";

    public static string FormatAssignmentsNotCollected(string reason, string capacityResourceId)
    {
        return $"{AssignmentsNotCollectedBase}:{reason}:{NormalizeCapacityId(capacityResourceId)}";
    }

    public static string FormatWorkspacesOutsideInventory(int count, string capacityResourceId)
    {
        return $"{WorkspacesOutsideInventoryBase}:{count}:{NormalizeCapacityId(capacityResourceId)}";
    }

    private static string NormalizeCapacityId(string capacityResourceId)
    {
        return capacityResourceId.Trim().TrimEnd('/');
    }
}
