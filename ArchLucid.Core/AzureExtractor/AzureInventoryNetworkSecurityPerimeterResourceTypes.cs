namespace ArchLucid.Core.AzureExtractor;

/// <summary>ARM types for Azure Network Security Perimeter (NR-37).</summary>
public static class AzureInventoryNetworkSecurityPerimeterResourceTypes
{
    public const string PerimeterArmType = "Microsoft.Network/networkSecurityPerimeters";

    public const string ResourceAssociationsPathSegment = "/resourceAssociations/";

    public static bool IsPerimeterResourceType(string? armResourceType)
    {
        return string.Equals(armResourceType, PerimeterArmType, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsDiagramOmitChildType(string? armResourceType)
    {
        if (string.IsNullOrWhiteSpace(armResourceType))
        {
            return false;
        }

        if (IsPerimeterResourceType(armResourceType))
        {
            return false;
        }

        return armResourceType.Contains("networkSecurityPerimeters/", StringComparison.OrdinalIgnoreCase);
    }

    public static bool TryParsePerimeterIdFromResourceAssociationId(
        string? resourceAssociationId,
        out string? perimeterId)
    {
        perimeterId = null;

        if (string.IsNullOrWhiteSpace(resourceAssociationId))
        {
            return false;
        }

        string normalized = resourceAssociationId.Trim();
        int segmentIndex = normalized.IndexOf(ResourceAssociationsPathSegment, StringComparison.OrdinalIgnoreCase);

        if (segmentIndex <= 0)
        {
            return false;
        }

        perimeterId = normalized[..segmentIndex];

        return true;
    }
}
