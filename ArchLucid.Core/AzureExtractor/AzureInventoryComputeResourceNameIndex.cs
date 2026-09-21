using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Maps compute or UAMI resource names to ARM ids for unique-name joins (SN-RT-08).
/// </summary>
public static class AzureInventoryComputeResourceNameIndex
{
    public static Dictionary<string, List<string>> BuildNameToArmIds(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources)
    {
        ArgumentNullException.ThrowIfNull(resources);

        Dictionary<string, List<string>> nameToArmIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureExtractorExtendedResourceRow resource in resources)
        {
            string? name = ReadResourceName(resource);

            if (string.IsNullOrWhiteSpace(name))
            {
                continue;
            }

            if (!IsJoinableResourceType(resource.ResourceType))
            {
                continue;
            }

            string armId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId);

            if (!nameToArmIds.TryGetValue(name.Trim(), out List<string>? armIds))
            {
                armIds = [];
                nameToArmIds[name.Trim()] = armIds;
            }

            armIds.Add(armId);
        }

        return nameToArmIds;
    }

    public static bool TryResolveUniqueComputeArmId(
        IReadOnlyDictionary<string, List<string>> nameToArmIds,
        string principalName,
        out string computeArmId)
    {
        computeArmId = string.Empty;

        if (string.IsNullOrWhiteSpace(principalName))
        {
            return false;
        }

        if (!nameToArmIds.TryGetValue(principalName.Trim(), out List<string>? matches)
            || matches.Count != 1)
        {
            return false;
        }

        computeArmId = matches[0];

        return true;
    }

    private static bool IsJoinableResourceType(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.Contains("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("Microsoft.App/containerApps", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("Microsoft.ManagedIdentity/userAssignedIdentities", StringComparison.OrdinalIgnoreCase);
    }

    private static string? ReadResourceName(AzureExtractorExtendedResourceRow resource)
    {
        if (!string.IsNullOrWhiteSpace(resource.Name))
        {
            return resource.Name;
        }

        string armId = resource.AzureResourceId;
        int lastSlash = armId.LastIndexOf('/');

        if (lastSlash < 0 || lastSlash >= armId.Length - 1)
        {
            return null;
        }

        return armId[(lastSlash + 1)..];
    }
}
