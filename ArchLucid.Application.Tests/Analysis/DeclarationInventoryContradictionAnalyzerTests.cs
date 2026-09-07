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

    [Fact]
    public void Analyze_detects_storage_encryption_mismatch_for_aws_rds()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "rds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "pay-db",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] = "arn:aws:rds:us-east-1:123456789012:db:pay-db",
                        ["tf.storage_encrypted"] = "true",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "name": "arn:aws:rds:us-east-1:123456789012:db:pay-db",
                "resourceType": "AWS::RDS::DBInstance",
                "properties": {
                  "storageEncrypted": false
                }
              }
            ]
            """;

        IReadOnlyList<DeclarationInventoryContradictionMismatch> mismatches =
            DeclarationInventoryContradictionAnalyzer.Analyze(
                InventoryTopologyCloudProvider.Aws,
                resourcesJson,
                graph);

        DeclarationInventoryContradictionMismatch mismatch = mismatches.Should().ContainSingle().Subject;
        mismatch.DeclarationKey.Should().Be("tf.storage_encrypted");
        mismatch.SecurityTheme.Should().Be("encryption");
    }

    [Fact]
    public void Analyze_detects_network_acl_default_action_mismatch_for_azure_storage()
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
                        ["tf.networkacls"] = """{"defaultaction":"deny"}""",
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
                  "defaultAction": "Allow"
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
        mismatch.DeclarationKey.Should().Be("tf.networkacls");
        mismatch.SecurityTheme.Should().Be("network-isolation");
    }

    [Fact]
    public void Analyze_detects_k8s_privileged_mismatch_when_inventory_row_exists()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "deploy-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "payment-api",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks-prod",
                        ["k8s.privileged"] = "false",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks-prod",
                "resourceType": "apps/v1/Deployment",
                "properties": {
                  "privileged": true
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
        mismatch.DeclarationKey.Should().Be("k8s.privileged");
        mismatch.SecurityTheme.Should().Be("workload-isolation");
    }

    [Fact]
    public void TryResolveSecurityTheme_returns_false_for_unknown_logical_name()
    {
        DeclarationInventorySecurityPropertyInventoryReader.TryResolveSecurityTheme(
            "NotARealProperty",
            out string theme).Should().BeFalse();

        theme.Should().BeEmpty();
    }
}
