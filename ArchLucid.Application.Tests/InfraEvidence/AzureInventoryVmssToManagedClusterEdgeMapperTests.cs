using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryVmssToManagedClusterEdgeMapperTests
{
    private const string NodeResourceGroup = "MC_tie0-caks-nprd-h1_aks-maks-hi-nprd-weus-300_westus";

    [Fact]
    public void MapNodePools_emits_one_observed_edge_per_matching_scale_set()
    {
        const string clusterId =
            "/subscriptions/sub/resourceGroups/tie0-caks-nprd-h1/providers/Microsoft.ContainerService/managedClusters/aks-maks-hi-nprd-weus-300";
        const string scaleSetOneId =
            $"/subscriptions/sub/resourceGroups/{NodeResourceGroup}/providers/Microsoft.Compute/virtualMachineScaleSets/aks-aephidev-16035491-vmss";
        const string scaleSetTwoId =
            $"/subscriptions/sub/resourceGroups/{NodeResourceGroup}/providers/Microsoft.Compute/virtualMachineScaleSets/aks-aephiprd-36061057-vmss";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            CreateCluster(clusterId),
            CreateScaleSet(scaleSetOneId),
            CreateScaleSet(scaleSetTwoId),
        ];
        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);

        AzureInventoryVmssToManagedClusterEdgeMapper.MapNodePools(resources, relationships, keys);

        relationships.Should().HaveCount(2);
        relationships.Should().OnlyContain(relationship =>
            relationship.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(clusterId));
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryNodePool);
    }

    [Fact]
    public void MapNodePools_skips_scale_set_in_unrelated_resource_group()
    {
        const string clusterId =
            "/subscriptions/sub/resourceGroups/tie0-caks-nprd-h1/providers/Microsoft.ContainerService/managedClusters/aks-maks-hi-nprd-weus-300";
        const string scaleSetId =
            "/subscriptions/sub/resourceGroups/other-rg/providers/Microsoft.Compute/virtualMachineScaleSets/aks-aephidev-16035491-vmss";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            CreateCluster(clusterId),
            CreateScaleSet(scaleSetId),
        ];
        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);

        AzureInventoryVmssToManagedClusterEdgeMapper.MapNodePools(resources, relationships, keys);

        relationships.Should().BeEmpty();
    }

    private static AzureExtractorExtendedResourceRow CreateCluster(string clusterId)
    {
        return new AzureExtractorExtendedResourceRow
        {
            AzureResourceId = clusterId,
            ResourceType = "Microsoft.ContainerService/managedClusters",
            Name = "aks-maks-hi-nprd-weus-300",
            Properties = new Dictionary<string, string>
            {
                ["nodeResourceGroup"] = NodeResourceGroup,
            },
        };
    }

    private static AzureExtractorExtendedResourceRow CreateScaleSet(string scaleSetId)
    {
        return new AzureExtractorExtendedResourceRow
        {
            AzureResourceId = scaleSetId,
            ResourceType = "Microsoft.Compute/virtualMachineScaleSets",
            Name = "aks-aephidev-16035491-vmss",
            Properties = new Dictionary<string, string>(),
        };
    }
}
