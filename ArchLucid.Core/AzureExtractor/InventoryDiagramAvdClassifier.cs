using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Classifies inventory resources that belong to the Azure Virtual Desktop boundary (NR-06).</summary>
public static class InventoryDiagramAvdClassifier
{
    public static bool TryClassify(
        string? armResourceType,
        string? armResourceId,
        out InventoryDiagramAvdCategory category)
    {
        category = default;

        if (string.IsNullOrWhiteSpace(armResourceType))
        {
            return false;
        }

        foreach (InventoryDiagramAvdResourceMappingEntry entry in InventoryDiagramAvdResourceMapping.DesktopVirtualizationArmTypes)
        {
            if (armResourceType.Equals(entry.ArmResourceType, StringComparison.OrdinalIgnoreCase))
            {
                category = entry.Category;
                return true;
            }
        }

        if (IsSessionHostArmType(armResourceType, armResourceId))
        {
            category = InventoryDiagramAvdCategory.SessionHost;
            return true;
        }

        if (armResourceType.Equals("Microsoft.Compute/galleries/images/versions", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Compute/galleries/images", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramAvdCategory.ImageDefinition;
            return true;
        }

        if (armResourceType.Equals("Microsoft.VirtualMachineImages/imageTemplates", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramAvdCategory.ImageTemplate;
            return true;
        }

        return false;
    }

    public static bool IsDesktopVirtualizationArmType(string? armResourceType)
    {
        return !string.IsNullOrWhiteSpace(armResourceType)
            && armResourceType.StartsWith(
                InventoryDiagramAvdResourceMapping.DesktopVirtualizationProviderPrefix,
                StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsExclusiveSupportingArmType(string? armResourceType)
    {
        if (string.IsNullOrWhiteSpace(armResourceType))
        {
            return false;
        }

        if (IsSharedInfrastructureArmType(armResourceType))
        {
            return false;
        }

        foreach (string prefix in InventoryDiagramAvdResourceMapping.ExclusiveSupportingArmTypePrefixes)
        {
            if (armResourceType.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    public static bool IsSharedInfrastructureArmType(string? armResourceType)
    {
        if (string.IsNullOrWhiteSpace(armResourceType))
        {
            return false;
        }

        return armResourceType.Contains("azureFirewalls", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Contains("virtualNetworks", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Contains("virtualNetworkGateways", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Network/networkSecurityGroups", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Contains("/subnets", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsSessionHostArmType(string? armResourceType, string? armResourceId)
    {
        if (!string.IsNullOrWhiteSpace(armResourceType)
            && armResourceType.Contains("/sessionHosts", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return !string.IsNullOrWhiteSpace(armResourceId)
            && armResourceId.Contains(InventoryDiagramAvdResourceMapping.SessionHostArmIdSegment, StringComparison.OrdinalIgnoreCase);
    }

    public static string? TryReadHostPoolArmId(string? armResourceId)
    {
        if (string.IsNullOrWhiteSpace(armResourceId))
        {
            return null;
        }

        int sessionHostIndex = armResourceId.IndexOf(
            InventoryDiagramAvdResourceMapping.SessionHostArmIdSegment,
            StringComparison.OrdinalIgnoreCase);

        if (sessionHostIndex > 0)
        {
            return ArmResourceIdNormalizer.Normalize(armResourceId[..sessionHostIndex]);
        }

        foreach (string childSegment in new[] { "/applicationGroups/", "/scalingPlans/" })
        {
            int childIndex = armResourceId.IndexOf(childSegment, StringComparison.OrdinalIgnoreCase);

            if (childIndex > 0)
            {
                return ArmResourceIdNormalizer.Normalize(armResourceId[..childIndex]);
            }
        }

        if (string.Equals(
                ReadArmTypeFromArmId(armResourceId),
                "Microsoft.DesktopVirtualization/hostPools",
                StringComparison.OrdinalIgnoreCase))
        {
            return ArmResourceIdNormalizer.Normalize(armResourceId);
        }

        return null;
    }

    private static string? ReadArmTypeFromArmId(string armResourceId)
    {
        const string providersSegment = "/providers/";

        int providersIndex = armResourceId.IndexOf(providersSegment, StringComparison.OrdinalIgnoreCase);

        if (providersIndex < 0)
        {
            return null;
        }

        string remainder = armResourceId[(providersIndex + providersSegment.Length)..];
        int slashIndex = remainder.IndexOf('/');

        if (slashIndex < 0)
        {
            return remainder;
        }

        int secondSlashIndex = remainder.IndexOf('/', slashIndex + 1);

        return secondSlashIndex < 0
            ? remainder
            : remainder[..secondSlashIndex];
    }
}
