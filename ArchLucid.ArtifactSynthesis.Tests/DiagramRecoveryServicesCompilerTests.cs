using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "ArtifactSynthesis")]
public sealed class DiagramRecoveryServicesCompilerTests
{
    private const string VaultId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/backup-vault";
    private const string VaultId2 =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/other-vault";
    private const string VmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/app-vm";

    [Fact]
    public void FullSubscription_flag_off_omits_recovery_vault()
    {
        GraphSnapshot graph = BuildGraph(withProtectionEdge: true);

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(
            graph,
            DiagramMode.FullSubscription,
            new DiagramAstCompileOptions { IncludeRecoveryServices = false });

        ast.Nodes.Should().NotContain(node => node.Label == "backup-vault");
    }

    [Fact]
    public void FullSubscription_flag_on_includes_vault_with_cited_edge_only()
    {
        GraphSnapshot graph = BuildGraph(withProtectionEdge: true, includeSecondVault: true);

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(
            graph,
            DiagramMode.FullSubscription,
            new DiagramAstCompileOptions { IncludeRecoveryServices = true });

        ast.Nodes.Should().Contain(node => node.Label == "backup-vault");
        ast.Nodes.Should().Contain(node => node.Label == "app-vm");
        ast.Nodes.Should().NotContain(node => node.Label == "other-vault");
        ast.Edges.Should().Contain(edge => edge.Label == AzureInventoryRecoveryServices.BackupEdgeLabel);
    }

    [Fact]
    public void Network_flag_on_omits_vault_when_protected_vm_not_in_network_set()
    {
        GraphSnapshot graph = BuildGraph(withProtectionEdge: true);

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(
            graph,
            DiagramMode.Network,
            new DiagramAstCompileOptions { IncludeRecoveryServices = true });

        ast.Nodes.Should().NotContain(node => node.Label == "backup-vault");
    }

    [Fact]
    public void BusinessContinuity_flag_off_still_includes_vault()
    {
        GraphSnapshot graph = BuildGraph(withProtectionEdge: false);

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(
            graph,
            DiagramMode.BusinessContinuity,
            new DiagramAstCompileOptions { IncludeRecoveryServices = false });

        ast.Nodes.Should().Contain(node => node.Label == "backup-vault");
    }

    private static GraphSnapshot BuildGraph(bool withProtectionEdge, bool includeSecondVault = false)
    {
        GraphNode vault = TopologyNode("vault-node", VaultId, AzureInventoryRecoveryServices.VaultResourceType, "backup-vault");
        GraphNode vm = TopologyNode("vm-node", VmId, "Microsoft.Compute/virtualMachines", "app-vm");
        List<GraphNode> nodes = [vault, vm];

        if (includeSecondVault)
        {
            nodes.Add(TopologyNode(
                "vault-node-2",
                VaultId2,
                AzureInventoryRecoveryServices.VaultResourceType,
                "other-vault"));
        }

        List<GraphEdge> edges = [];

        if (withProtectionEdge)
        {
            edges.Add(new GraphEdge
            {
                EdgeId = "edge-protects",
                FromNodeId = vault.NodeId,
                ToNodeId = vm.NodeId,
                EdgeType = GraphEdgeTypes.Protects,
                Label = AzureInventoryRecoveryServices.BackupEdgeLabel,
                InferenceSource = GraphEdgeInferenceSources.InventoryRecoveryServicesProtects,
            });
        }

        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes,
            Edges = edges,
        };
    }

    private static GraphNode TopologyNode(string nodeId, string armId, string armType, string label)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = "Compute",
            Properties =
            {
                ["arm.id"] = armId,
                ["arm.type"] = armType,
            },
        };
    }
}
