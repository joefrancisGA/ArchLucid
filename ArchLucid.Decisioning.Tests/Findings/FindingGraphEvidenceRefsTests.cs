using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingGraphEvidenceRefsTests
{
    [Fact]
    public void CollectWithProductShapedGraphNodeFallback_cites_azure_resource_type_on_node()
    {
        GraphSnapshot graphSnapshot = BuildTypedTopologyNode(
            "obj-payments-kv",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["type"] = "Microsoft.KeyVault/vaults",
                ["resourceId"] =
                    "/subscriptions/00000000-0000-4000-8000-000000000072/resourceGroups/rg-golden/providers/Microsoft.KeyVault/vaults/payments-kv",
            });

        List<string> evidenceRefs = FindingGraphEvidenceRefs.CollectWithProductShapedGraphNodeFallback(
            graphSnapshot,
            ["obj-payments-kv"]);

        evidenceRefs.Should().Contain("graph-node:Microsoft.KeyVault/vaults");
        evidenceRefs.Should().Contain(
            "/subscriptions/00000000-0000-4000-8000-000000000072/resourceGroups/rg-golden/providers/Microsoft.KeyVault/vaults/payments-kv");
        GenericArchitectureAdvicePatterns.HasProductShapedInventoryEvidence(evidenceRefs).Should().BeTrue();
    }

    [Fact]
    public void CollectWithProductShapedGraphNodeFallback_cites_aws_and_gcp_product_types()
    {
        GraphSnapshot graphSnapshot = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "fn-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "checkout",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["awsType"] = "AWS::Lambda::Function",
                    },
                },
                new GraphNode
                {
                    NodeId = "vm-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "web",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["terraformType"] = "google_compute_instance",
                    },
                },
            ],
        };

        List<string> lambdaRefs = FindingGraphEvidenceRefs.CollectWithProductShapedGraphNodeFallback(
            graphSnapshot,
            ["fn-1"]);
        List<string> vmRefs = FindingGraphEvidenceRefs.CollectWithProductShapedGraphNodeFallback(
            graphSnapshot,
            ["vm-1"]);

        lambdaRefs.Should().Contain("graph-node:AWS::Lambda::Function");
        vmRefs.Should().Contain("graph-node:google_compute_instance");
    }

    [Fact]
    public void CollectWithProductShapedGraphNodeFallback_skips_label_only_node_ids()
    {
        GraphSnapshot graphSnapshot = BuildTypedTopologyNode("t1", "name", "web");

        List<string> evidenceRefs = FindingGraphEvidenceRefs.CollectWithProductShapedGraphNodeFallback(
            graphSnapshot,
            ["t1"]);

        evidenceRefs.Should().BeEmpty();
    }

    private static GraphSnapshot BuildTypedTopologyNode(string nodeId, string propertyKey, string propertyValue)
    {
        return BuildTypedTopologyNode(
            nodeId,
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [propertyKey] = propertyValue,
            });
    }

    private static GraphSnapshot BuildTypedTopologyNode(string nodeId, Dictionary<string, string> properties)
    {
        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = nodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = nodeId,
                    Properties = properties,
                },
            ],
        };
    }
}
