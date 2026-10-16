using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryKubernetesClusterLoadBalancerOwnershipTests
{
    private const string ClusterId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/myaks";

    [Fact]
    public void LoadBalancerTagsIndicateClusterOwnership_matches_kubernetes_cluster_name_tag()
    {
        Dictionary<string, string> tags = new(StringComparer.OrdinalIgnoreCase)
        {
            [AzureInventoryKubernetesClusterLoadBalancerOwnership.KubernetesClusterNameTag] = "myaks",
        };

        AzureInventoryKubernetesClusterLoadBalancerOwnership.LoadBalancerTagsIndicateClusterOwnership(
                tags,
                "myaks",
                ClusterId)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void LoadBalancerTagsIndicateClusterOwnership_rejects_resource_group_match_without_tag()
    {
        Dictionary<string, string> tags = new(StringComparer.OrdinalIgnoreCase)
        {
            ["environment"] = "prod",
        };

        AzureInventoryKubernetesClusterLoadBalancerOwnership.LoadBalancerTagsIndicateClusterOwnership(
                tags,
                "myaks",
                ClusterId)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void LoadBalancerTagsIndicateClusterOwnership_matches_aks_managed_cluster_name_tag()
    {
        Dictionary<string, string> tags = new(StringComparer.OrdinalIgnoreCase)
        {
            [AzureInventoryKubernetesClusterLoadBalancerOwnership.AksManagedClusterNameTag] = "myaks",
        };

        AzureInventoryKubernetesClusterLoadBalancerOwnership.LoadBalancerTagsIndicateClusterOwnership(
                tags,
                "myaks",
                ClusterId)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Managed_cluster_to_load_balancer_is_not_a_data_flow_traversal_hop()
    {
        InventoryDiagramDataFlowTraversalHopClassifier.IsTraversalHopAssociation(
                AzureInventoryRelationshipAssociationTypes.ManagedClusterToLoadBalancer,
                GraphEdgeInferenceSources.InventoryAksServiceLoadBalancer)
            .Should()
            .BeFalse();
    }
}
