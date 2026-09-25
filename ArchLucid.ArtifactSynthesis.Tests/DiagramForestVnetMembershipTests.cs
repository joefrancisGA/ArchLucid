using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramForestVnetMembershipTests
{
    [Fact]
    public void Resolve_subnet_placement_adds_workload_to_parent_vnet()
    {
        const string vnetArmId = "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/app";

        DiagramNode vnet = Node("vnet", "Microsoft.Network/virtualNetworks", vnetArmId);
        DiagramNode subnet = Node(
            "subnet",
            "Microsoft.Network/virtualNetworks/subnets",
            $"{vnetArmId}/subnets/app");
        DiagramNode vm = Node("vm", "Microsoft.Compute/virtualMachines", "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Compute/virtualMachines/app");

        IReadOnlySet<string> members = DiagramForestVnetMembership.ResolveMembers(
            vnet,
            [vnet, subnet, vm],
            [
                new DiagramEdge
                {
                    FromNodeId = "vm",
                    ToNodeId = "subnet",
                    Label = "in",
                    InferenceSource = AzureInventoryRelationshipAssociationTypes.NicToSubnet,
                },
            ]);

        members.Should().BeEquivalentTo(["vnet", "subnet", "vm"]);
    }

    [Fact]
    public void Resolve_collocation_does_not_create_vnet_members()
    {
        DiagramNode vnet = Node("vnet", "Microsoft.Network/virtualNetworks", "/vnet");
        DiagramNode vm = Node("vm", "Microsoft.Compute/virtualMachines", "/vm");

        IReadOnlySet<string> members = DiagramForestVnetMembership.ResolveMembers(
            vnet,
            [vnet, vm],
            [
                new DiagramEdge
                {
                    FromNodeId = "vm",
                    ToNodeId = "vnet",
                    Label = "likely · in",
                    InferenceSource = GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
                },
            ]);

        members.Should().ContainSingle().Which.Should().Be("vnet");
    }

    [Fact]
    public void Resolve_same_resource_group_only_excludes_cross_group_workload()
    {
        DiagramNode vnet = Node("vnet", "Microsoft.Network/virtualNetworks", "/vnet", "rg-net");
        DiagramNode vm = Node("vm", "Microsoft.Compute/virtualMachines", "/vm", "rg-app");

        IReadOnlySet<string> members = DiagramForestVnetMembership.ResolveMembers(
            vnet,
            [vnet, vm],
            [
                new DiagramEdge
                {
                    FromNodeId = "vm",
                    ToNodeId = "vnet",
                    Label = "in",
                    InferenceSource = GraphEdgeInferenceSources.InventoryLayoutVmVnet,
                },
            ],
            sameResourceGroupOnly: true);

        members.Should().ContainSingle().Which.Should().Be("vnet");
    }

    private static DiagramNode Node(
        string nodeId,
        string armType,
        string armId,
        string resourceGroup = "rg-app")
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = nodeId,
            NodeType = "TopologyResource",
            ArmResourceType = armType,
            ArmResourceId = armId,
            ArmResourceGroup = resourceGroup,
        };
    }
}
