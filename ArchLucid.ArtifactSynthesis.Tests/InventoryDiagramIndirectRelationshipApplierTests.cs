using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramIndirectRelationshipApplierTests
{
    private const string VirtualMachineArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app";

    private const string NicArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-app";

    private const string SubnetArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/app";

    private const string KeyVaultArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv-app";

    private const string PrivateEndpointArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-kv";

    private const string StorageAccountArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stapp";

    private const string UnconnectedStorageArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/standalone";

    private const string RedisArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Cache/redis/redis-app";

    private const string WebAppArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-api";

    private const string CollocatedVmArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-collocated";

    private const string CollocatedDiskArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/disk-collocated";

    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_vm_nic_subnet_chain_emits_derived_vm_to_subnet_edge_citing_nic_hop()
    {
        GraphSnapshot graph = BuildVmNicSubnetGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Edges.Should().Contain(edge =>
            !edge.IsLayoutOnly
            && edge.Label.Contains("Derived", StringComparison.Ordinal)
            && edge.Label.Contains("nic-app", StringComparison.Ordinal)
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryIndirectDerivedRelationship);
    }

    [Fact]
    public void Compile_key_vault_private_endpoint_emits_current_edge()
    {
        GraphSnapshot graph = BuildKeyVaultPrivateEndpointGraph();

        DiagramAst ast = compiler.Compile(
            graph,
            DiagramMode.FullSubscription,
            new DiagramAstCompileOptions { IncludePrivateEndpointNodes = true });

        ast.Edges.Should().Contain(edge =>
            !edge.IsLayoutOnly
            && edge.Label.Contains("Current", StringComparison.Ordinal)
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryPrivateEndpoint);
    }

    [Fact]
    public void Compile_iac_only_storage_mount_emits_configured_edge()
    {
        GraphSnapshot graph = BuildConfiguredStorageMountGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Edges.Should().Contain(edge =>
            !edge.IsLayoutOnly
            && edge.Label.Contains("Configured", StringComparison.Ordinal)
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryPropertyArmId);
    }

    [Fact]
    public void Compile_log_only_redis_call_emits_observed_edge()
    {
        GraphSnapshot graph = BuildObservedRedisCallGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Edges.Should().Contain(edge =>
            !edge.IsLayoutOnly
            && edge.Label.Contains("Observed", StringComparison.Ordinal)
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryObservedDependency);
    }

    [Fact]
    public void Compile_storage_account_without_cited_reference_remains_unconnected()
    {
        GraphSnapshot graph = BuildUnconnectedStorageGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().ContainSingle(node => node.ArmResourceId == UnconnectedStorageArmId);
        ast.Edges.Should().NotContain(edge =>
            !edge.IsLayoutOnly
            && (edge.FromNodeId.Contains("standalone", StringComparison.Ordinal)
                || edge.ToNodeId.Contains("standalone", StringComparison.Ordinal)));
    }

    [Fact]
    public void Compile_same_resource_group_collocation_does_not_emit_edge()
    {
        GraphSnapshot graph = BuildCollocationGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Edges.Should().NotContain(edge =>
            !edge.IsLayoutOnly
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryResourceGroupCollocation);
    }

    private static GraphSnapshot BuildVmNicSubnetGraph()
    {
        GraphNode virtualMachine = CreateTopologyNode(
            "vm-node",
            VirtualMachineArmId,
            "Microsoft.Compute/virtualMachines");
        GraphNode nic = CreateTopologyNode(
            "nic-node",
            NicArmId,
            "Microsoft.Network/networkInterfaces");
        GraphNode subnet = CreateTopologyNode(
            "subnet-node",
            SubnetArmId,
            "Microsoft.Network/virtualNetworks/subnets");

        return CreateGraph(
            [virtualMachine, nic, subnet],
            [
                CreateEdge(
                    "vm-node",
                    "nic-node",
                    AzureInventoryRelationshipAssociationTypes.VmToNic,
                    GraphEdgeInferenceSources.InventoryVmNic),
                CreateEdge(
                    "nic-node",
                    "subnet-node",
                    AzureInventoryRelationshipAssociationTypes.NicToSubnet,
                    GraphEdgeInferenceSources.InventoryNicSubnet),
            ]);
    }

    private static GraphSnapshot BuildKeyVaultPrivateEndpointGraph()
    {
        GraphNode keyVault = CreateTopologyNode(
            "kv-node",
            KeyVaultArmId,
            "Microsoft.KeyVault/vaults");
        GraphNode privateEndpoint = CreateTopologyNode(
            "pe-node",
            PrivateEndpointArmId,
            "Microsoft.Network/privateEndpoints");

        return CreateGraph(
            [keyVault, privateEndpoint],
            [
                CreateEdge(
                    "pe-node",
                    "kv-node",
                    AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                    GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                    provenanceKind: ProvenanceKind.ObservedFact.ToString()),
            ]);
    }

    private static GraphSnapshot BuildConfiguredStorageMountGraph()
    {
        GraphNode virtualMachine = CreateTopologyNode(
            "vm-node",
            VirtualMachineArmId,
            "Microsoft.Compute/virtualMachines");
        virtualMachine.Properties[InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency] =
            InventoryDiagramEvidenceCurrency.Configured.ToString();

        GraphNode storage = CreateTopologyNode(
            "storage-node",
            StorageAccountArmId,
            "Microsoft.Storage/storageAccounts");

        return CreateGraph(
            [virtualMachine, storage],
            [
                CreateEdge(
                    "vm-node",
                    "storage-node",
                    GraphEdgeTypes.ConnectsTo,
                    GraphEdgeInferenceSources.InventoryPropertyArmId,
                    provenanceKind: ProvenanceKind.DeterministicInference.ToString()),
            ]);
    }

    private static GraphSnapshot BuildObservedRedisCallGraph()
    {
        GraphNode webApp = CreateTopologyNode(
            "webapp-node",
            WebAppArmId,
            "Microsoft.Web/sites");
        GraphNode redis = CreateTopologyNode(
            "redis-node",
            RedisArmId,
            "Microsoft.Cache/redis");

        return CreateGraph(
            [webApp, redis],
            [
                CreateEdge(
                    "webapp-node",
                    "redis-node",
                    GraphEdgeTypes.ConnectsTo,
                    GraphEdgeInferenceSources.InventoryObservedDependency,
                    provenanceKind: ProvenanceKind.ObservedFact.ToString()),
            ]);
    }

    private static GraphSnapshot BuildUnconnectedStorageGraph()
    {
        GraphNode storage = CreateTopologyNode(
            "storage-node",
            UnconnectedStorageArmId,
            "Microsoft.Storage/storageAccounts");

        return CreateGraph([storage], []);
    }

    private static GraphSnapshot BuildCollocationGraph()
    {
        GraphNode virtualMachine = CreateTopologyNode(
            "vm-collocated-node",
            CollocatedVmArmId,
            "Microsoft.Compute/virtualMachines");
        GraphNode disk = CreateTopologyNode(
            "disk-collocated-node",
            CollocatedDiskArmId,
            "Microsoft.Compute/disks");

        return CreateGraph(
            [virtualMachine, disk],
            [
                CreateEdge(
                    "vm-collocated-node",
                    "disk-collocated-node",
                    GraphEdgeTypes.ConnectsTo,
                    GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
                    provenanceKind: ProvenanceKind.DeterministicInference.ToString()),
            ]);
    }

    private static GraphSnapshot CreateGraph(
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyList<GraphEdge> edges)
    {
        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes.ToList(),
            Edges = edges.ToList(),
        };
    }

    private static GraphEdge CreateEdge(
        string fromNodeId,
        string toNodeId,
        string edgeType,
        string inferenceSource,
        string? provenanceKind = null)
    {
        return new GraphEdge
        {
            EdgeId = $"edge-{fromNodeId}-{toNodeId}-{inferenceSource}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = edgeType,
            Weight = 1.0d,
            InferenceSource = inferenceSource,
            ProvenanceKind = provenanceKind,
        };
    }

    private static GraphNode CreateTopologyNode(string nodeId, string armId, string armType)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = MermaidIdSanitizer.Sanitize(armId),
            Category = "network",
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = armType,
                ["arm.resourceGroup"] = "rg",
            },
        };
    }
}
