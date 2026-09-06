using ArchLucid.Application.Analysis;
using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class DeclarationInventoryContradictionAnalyzerTests
{
    [Fact]
    public void Analyze_detects_public_network_access_mismatch_for_matching_resource_ids()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "storage-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "stpayprod",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod",
                        ["tf.public_network_access"] = "Disabled",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod",
                "properties": {
                  "publicNetworkAccess": "Enabled"
                }
              }
            ]
            """;

        IReadOnlyList<DeclarationInventoryContradictionMismatch> mismatches =
            DeclarationInventoryContradictionAnalyzer.Analyze(
                InventoryTopologyCloudProvider.Azure,
                resourcesJson,
                graph);

        DeclarationInventoryContradictionMismatch mismatch = mismatches.Should().ContainSingle().Subject;
        mismatch.DeclarationKey.Should().Be("tf.public_network_access");
        mismatch.DeclarationValue.Should().Be("Disabled");
        mismatch.InventoryValue.Should().Be("Enabled");
        mismatch.SecurityTheme.Should().Be("data-protection");
    }

    [Fact]
    public void Analyze_skips_resources_without_shared_inventory_row()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "storage-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "planned-only",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/planned-only",
                        ["tf.public_network_access"] = "Disabled",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/live-only",
                "properties": {
                  "publicNetworkAccess": "Enabled"
                }
              }
            ]
            """;

        IReadOnlyList<DeclarationInventoryContradictionMismatch> mismatches =
            DeclarationInventoryContradictionAnalyzer.Analyze(
                InventoryTopologyCloudProvider.Azure,
                resourcesJson,
                graph);

        mismatches.Should().BeEmpty();
    }
}
