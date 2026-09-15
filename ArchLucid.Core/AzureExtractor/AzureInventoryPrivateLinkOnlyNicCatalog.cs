using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Network interfaces created solely for private endpoint connectivity. VM-attached NICs remain visible
///     even when also referenced by private endpoints.
/// </summary>
public static class AzureInventoryPrivateLinkOnlyNicCatalog
{
    private const string PeNicInferenceSource = "inventory-pe-nic";

    private const string VmNicInferenceSource = "inventory-vm-nic";

    public static bool IsNetworkInterface(string? resourceType, string? azureResourceId)
    {
        if (!string.IsNullOrWhiteSpace(resourceType)
            && resourceType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return !string.IsNullOrWhiteSpace(azureResourceId)
               && azureResourceId.Contains("/networkInterfaces/", StringComparison.OrdinalIgnoreCase);
    }

    public static HashSet<string> BuildOmittedNicArmIds(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        IReadOnlyList<JsonElement>? networkAssociations = null)
    {
        ArgumentNullException.ThrowIfNull(resources);

        HashSet<string> vmAttachedNicArmIds = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> privateEndpointNicArmIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureExtractorExtendedResourceRow resource in resources)
        {
            CollectResourceNicSignals(
                resource.ResourceType,
                resource.AzureResourceId,
                resource.Properties,
                vmAttachedNicArmIds,
                privateEndpointNicArmIds);
        }

        if (networkAssociations is not null)
        {
            CollectPackageAssociationNicSignals(networkAssociations, vmAttachedNicArmIds, privateEndpointNicArmIds);
        }

        return BuildOmittedNicArmIds(vmAttachedNicArmIds, privateEndpointNicArmIds);
    }

    public static HashSet<string> BuildOmittedNicArmIdsFromSnapshot(
        IReadOnlyList<AzureInventoryResourceRecord> resources,
        IReadOnlyList<AzureInventoryResourceRelationshipReadModel> relationships,
        IReadOnlyList<AzureInventoryResourcePropertyReadModel>? properties = null)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(relationships);

        HashSet<string> vmAttachedNicArmIds = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> privateEndpointNicArmIds = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByResourceRowId =
            (properties ?? [])
                .GroupBy(static property => property.ResourceRowId)
                .ToDictionary(static group => group.Key, static group => group.ToList());

        foreach (AzureInventoryResourceRecord resource in resources)
        {
            IReadOnlyDictionary<string, string> propertyLookup = propertiesByResourceRowId.TryGetValue(
                    resource.ResourceRowId,
                    out List<AzureInventoryResourcePropertyReadModel>? resourceProperties)
                ? resourceProperties.ToDictionary(
                    static property => property.PropertyKey,
                    static property => property.PropertyValue ?? string.Empty,
                    StringComparer.OrdinalIgnoreCase)
                : new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            CollectResourceNicSignals(
                resource.ResourceType,
                resource.AzureResourceId,
                propertyLookup,
                vmAttachedNicArmIds,
                privateEndpointNicArmIds);
        }

        foreach (AzureInventoryResourceRelationshipReadModel relationship in relationships)
        {
            CollectSnapshotRelationshipNicSignals(
                relationship.InferenceSource,
                relationship.ToAzureResourceId,
                vmAttachedNicArmIds,
                privateEndpointNicArmIds);
        }

        return BuildOmittedNicArmIds(vmAttachedNicArmIds, privateEndpointNicArmIds);
    }

    public static HashSet<string> BuildOmittedNicArmIdsFromInventoryResources(
        IEnumerable<AzureInventoryNicContextResource> resources,
        IReadOnlyList<JsonElement>? networkAssociations = null)
    {
        ArgumentNullException.ThrowIfNull(resources);

        HashSet<string> vmAttachedNicArmIds = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> privateEndpointNicArmIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryNicContextResource resource in resources)
        {
            CollectResourceNicSignals(
                resource.ResourceType,
                resource.AzureResourceId,
                resource.Properties,
                vmAttachedNicArmIds,
                privateEndpointNicArmIds);
        }

        if (networkAssociations is not null)
        {
            CollectPackageAssociationNicSignals(networkAssociations, vmAttachedNicArmIds, privateEndpointNicArmIds);
        }

        return BuildOmittedNicArmIds(vmAttachedNicArmIds, privateEndpointNicArmIds);
    }

    public static bool ShouldOmitNicArmId(string? azureResourceId, IReadOnlySet<string>? omittedNicArmIds)
    {
        if (omittedNicArmIds is null || omittedNicArmIds.Count == 0 || string.IsNullOrWhiteSpace(azureResourceId))
        {
            return false;
        }

        return omittedNicArmIds.Contains(ArmResourceIdNormalizer.Normalize(azureResourceId));
    }

    private static void CollectResourceNicSignals(
        string? resourceType,
        string? azureResourceId,
        IReadOnlyDictionary<string, string> properties,
        HashSet<string> vmAttachedNicArmIds,
        HashSet<string> privateEndpointNicArmIds)
    {
        if (IsNetworkInterface(resourceType, azureResourceId)
            && HasPrivateEndpointProperty(properties))
        {
            AddNormalizedNicArmId(azureResourceId, privateEndpointNicArmIds);
        }

        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return;
        }

        if (resourceType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase))
        {
            foreach (string nicArmId in ReadDelimitedIds(properties, "networkProfile.networkInterfaces"))
            {
                AddNormalizedNicArmId(nicArmId, vmAttachedNicArmIds);
            }
        }

        if (resourceType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
        {
            foreach (string nicArmId in ReadDelimitedIds(properties, "networkInterfaces"))
            {
                AddNormalizedNicArmId(nicArmId, privateEndpointNicArmIds);
            }
        }
    }

    private static void CollectPackageAssociationNicSignals(
        IReadOnlyList<JsonElement> networkAssociations,
        HashSet<string> vmAttachedNicArmIds,
        HashSet<string> privateEndpointNicArmIds)
    {
        foreach (JsonElement association in networkAssociations)
        {
            string? associationType = TryReadJsonString(association, "associationType");
            string? toResourceId = TryReadJsonString(association, "toResourceId");

            if (string.Equals(
                    associationType,
                    AzureInventoryRelationshipAssociationTypes.VmToNic,
                    StringComparison.OrdinalIgnoreCase))
            {
                AddNormalizedNicArmId(toResourceId, vmAttachedNicArmIds);
                continue;
            }

            if (string.Equals(
                    associationType,
                    AzureInventoryRelationshipAssociationTypes.PeToNic,
                    StringComparison.OrdinalIgnoreCase))
            {
                AddNormalizedNicArmId(toResourceId, privateEndpointNicArmIds);
            }
        }
    }

    private static void CollectSnapshotRelationshipNicSignals(
        string? inferenceSource,
        string? toAzureResourceId,
        HashSet<string> vmAttachedNicArmIds,
        HashSet<string> privateEndpointNicArmIds)
    {
        if (string.Equals(inferenceSource, VmNicInferenceSource, StringComparison.OrdinalIgnoreCase))
        {
            AddNormalizedNicArmId(toAzureResourceId, vmAttachedNicArmIds);
            return;
        }

        if (string.Equals(inferenceSource, PeNicInferenceSource, StringComparison.OrdinalIgnoreCase))
        {
            AddNormalizedNicArmId(toAzureResourceId, privateEndpointNicArmIds);
        }
    }

    private static HashSet<string> BuildOmittedNicArmIds(
        HashSet<string> vmAttachedNicArmIds,
        HashSet<string> privateEndpointNicArmIds)
    {
        privateEndpointNicArmIds.ExceptWith(vmAttachedNicArmIds);
        return privateEndpointNicArmIds;
    }

    private static bool HasPrivateEndpointProperty(IReadOnlyDictionary<string, string> properties)
    {
        foreach (KeyValuePair<string, string> property in properties)
        {
            if (!property.Key.Contains("privateEndpoint", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(property.Value))
            {
                return true;
            }
        }

        return false;
    }

    private static IEnumerable<string> ReadDelimitedIds(
        IReadOnlyDictionary<string, string> properties,
        string propertyKeyPrefix)
    {
        List<string> values = [];

        foreach (KeyValuePair<string, string> property in properties)
        {
            if (!property.Key.StartsWith(propertyKeyPrefix, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(property.Value))
            {
                values.Add(property.Value.Trim());
            }
        }

        if (values.Count == 0
            && properties.TryGetValue(propertyKeyPrefix, out string? singleValue)
            && !string.IsNullOrWhiteSpace(singleValue))
        {
            values.Add(singleValue.Trim());
        }

        foreach (string value in values.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            yield return value;
        }
    }

    private static void AddNormalizedNicArmId(string? azureResourceId, HashSet<string> target)
    {
        if (string.IsNullOrWhiteSpace(azureResourceId))
        {
            return;
        }

        target.Add(ArmResourceIdNormalizer.Normalize(azureResourceId));
    }

    private static string? TryReadJsonString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}

public readonly record struct AzureInventoryNicContextResource(
    string ResourceType,
    string AzureResourceId,
    IReadOnlyDictionary<string, string> Properties);
