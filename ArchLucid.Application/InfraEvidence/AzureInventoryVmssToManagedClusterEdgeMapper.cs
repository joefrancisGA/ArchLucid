using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Links AKS node-pool scale sets to their managed cluster via stored node resource group.</summary>
internal static class AzureInventoryVmssToManagedClusterEdgeMapper
{
    private const decimal ObservedFactConfidence = 1.0m;

    private const string ManagedClusterResourceType = "Microsoft.ContainerService/managedClusters";

    private const string ScaleSetResourceType = "Microsoft.Compute/virtualMachineScaleSets";

    public static void MapNodePools(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);

        if (!AzureInventoryRelationshipAssociationTypes.TryGet(
                AzureInventoryRelationshipAssociationTypes.VmssToManagedCluster,
                out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            return;
        }

        Dictionary<string, string> clusterIdsByNodeResourceGroup = resources
            .Where(resource => resource.ResourceType.Equals(
                ManagedClusterResourceType,
                StringComparison.OrdinalIgnoreCase))
            .Select(resource => new
            {
                ClusterId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId),
                NodeResourceGroup = ReadProperty(resource, "nodeResourceGroup"),
            })
            .Where(row => !string.IsNullOrWhiteSpace(row.NodeResourceGroup))
            .GroupBy(
                row => NormalizeResourceGroupName(row.NodeResourceGroup!),
                StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.First().ClusterId,
                StringComparer.OrdinalIgnoreCase);

        if (clusterIdsByNodeResourceGroup.Count == 0)
        {
            return;
        }

        foreach (AzureExtractorExtendedResourceRow scaleSet in resources.Where(IsScaleSet))
        {
            if (!ArmResourceIdNormalizer.TryGetResourceGroupName(
                    scaleSet.AzureResourceId,
                    out string scaleSetResourceGroupName))
            {
                continue;
            }

            string normalizedScaleSetResourceGroup = NormalizeResourceGroupName(scaleSetResourceGroupName);

            if (!clusterIdsByNodeResourceGroup.TryGetValue(
                    normalizedScaleSetResourceGroup,
                    out string? clusterId))
            {
                continue;
            }

            AddRelationship(
                scaleSet,
                clusterId,
                definition,
                relationships,
                relationshipKeys);
        }
    }

    private static bool IsScaleSet(AzureExtractorExtendedResourceRow resource)
    {
        return resource.ResourceType.Equals(
            ScaleSetResourceType,
            StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeResourceGroupName(string resourceGroupName)
    {
        return resourceGroupName.Trim();
    }

    private static string? ReadProperty(
        AzureExtractorExtendedResourceRow resource,
        string propertyName)
    {
        return resource.Properties.TryGetValue(propertyName, out string? value)
            ? value
            : null;
    }

    private static void AddRelationship(
        AzureExtractorExtendedResourceRow scaleSet,
        string clusterId,
        AzureInventoryRelationshipAssociationTypeDefinition definition,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        string fromResourceId = ArmResourceIdNormalizer.Normalize(scaleSet.AzureResourceId);
        string key = $"{fromResourceId}|{definition.AssociationType}|{clusterId}|{(int)ProvenanceKind.ObservedFact}";

        if (!relationshipKeys.Add(key))
        {
            return;
        }

        relationships.Add(new AzureInventoryResourceRelationshipWrite
        {
            FromAzureResourceId = fromResourceId,
            ToAzureResourceId = clusterId,
            RelationshipType = definition.DefaultGraphEdgeType,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            Confidence = ObservedFactConfidence,
            InferenceSource = definition.DefaultInferenceSource,
        });
    }
}
