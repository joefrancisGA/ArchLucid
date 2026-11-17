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
    public void CompareQuality_Analyze_detects_blob_public_access_mismatch_when_declaration_uses_allow_nested_items_to_be_public()
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
                        ["tf.allow_nested_items_to_be_public"] = "false",
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
                  "allowBlobPublicAccess": true
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
        mismatch.DeclarationKey.Should().Be("tf.allow_nested_items_to_be_public");
        mismatch.DeclarationValue.Should().Be("false");
        mismatch.InventoryValue.Should().Be("true");
        mismatch.SecurityTheme.Should().Be("data-protection");
        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeTrue();
    }

    [Fact]
    public void CompareQuality_Analyze_detects_network_acl_mismatch_when_terraform_network_rules_is_a_json_array()
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
                        ["tf.network_rules"] = """[{"default_action":"deny"}]""",
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
                  "networkAcls": {
                    "defaultAction": "Allow"
                  }
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
        mismatch.DeclarationKey.Should().Be("tf.network_rules");
        mismatch.DeclarationValue.Should().Be("""[{"default_action":"deny"}]""");
        mismatch.InventoryValue.Should().Be("Allow");
        mismatch.SecurityTheme.Should().Be("network-isolation");
        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeTrue();
    }

    [Fact]
    public void CompareQuality_Analyze_detects_https_only_mismatch_when_declaration_uses_https_traffic_only_enabled()
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
                        ["tf.https_traffic_only_enabled"] = "true",
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
                  "supportsHttpsTrafficOnly": false
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
        mismatch.DeclarationKey.Should().Be("tf.https_traffic_only_enabled");
        mismatch.DeclarationValue.Should().Be("true");
        mismatch.InventoryValue.Should().Be("false");
        mismatch.SecurityTheme.Should().Be("transport-security");
        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeTrue();
    }

    [Fact]
    public void CompareQuality_Analyze_detects_minimum_tls_mismatch_when_declaration_uses_compacted_tf_minimaltlsversion()
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
                        ["tf.minimaltlsversion"] = "TLS1_2",
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
                  "minimumTlsVersion": "TLS1_0"
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
        mismatch.DeclarationKey.Should().Be("tf.minimaltlsversion");
        mismatch.DeclarationValue.Should().Be("TLS1_2");
        mismatch.InventoryValue.Should().Be("TLS1_0");
        mismatch.SecurityTheme.Should().Be("transport-security");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_ssl_enforcement_mismatch_when_declaration_uses_tf_ssl_enforcement_shorthand()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "pg-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "pgflex",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/pgflex",
                        ["tf.ssl_enforcement"] = "Disabled",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.DBforPostgreSQL/flexibleServers",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/pgflex",
                "properties": {
                  "sslEnforcementEnabled": "Enabled"
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
        mismatch.DeclarationKey.Should().Be("tf.ssl_enforcement");
        mismatch.DeclarationValue.Should().Be("Disabled");
        mismatch.InventoryValue.Should().Be("Enabled");
        mismatch.SecurityTheme.Should().Be("transport-security");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_ssl_enforcement_mismatch_when_declaration_uses_compacted_tf_sslenforcement()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "pg-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "pgflex",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/pgflex",
                        ["tf.sslenforcement"] = "Disabled",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.DBforPostgreSQL/flexibleServers",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/pgflex",
                "properties": {
                  "sslEnforcementEnabled": "Enabled"
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
        mismatch.DeclarationKey.Should().Be("tf.sslenforcement");
        mismatch.DeclarationValue.Should().Be("Disabled");
        mismatch.InventoryValue.Should().Be("Enabled");
        mismatch.SecurityTheme.Should().Be("transport-security");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_ssl_enforcement_mismatch_when_inventory_uses_ssl_enforcement_without_enabled_suffix()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "pg-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "pgflex",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/pgflex",
                        ["tf.ssl_enforcement"] = "Disabled",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.DBforPostgreSQL/flexibleServers",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/pgflex",
                "properties": {
                  "sslEnforcement": "Enabled"
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
        mismatch.DeclarationKey.Should().Be("tf.ssl_enforcement");
        mismatch.DeclarationValue.Should().Be("Disabled");
        mismatch.InventoryValue.Should().Be("Enabled");
        mismatch.SecurityTheme.Should().Be("transport-security");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_ssl_enforcement_mismatch_when_declaration_uses_compacted_tf_sslenforcementenabled()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sql-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sqlprod",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sqlprod",
                        ["tf.sslenforcementenabled"] = "false",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Sql/servers",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sqlprod",
                "properties": {
                  "sslEnforcementEnabled": "Enabled"
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
        mismatch.DeclarationKey.Should().Be("tf.sslenforcementenabled");
        mismatch.DeclarationValue.Should().Be("false");
        mismatch.InventoryValue.Should().Be("Enabled");
        mismatch.SecurityTheme.Should().Be("transport-security");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_minimum_tls_mismatch_when_inventory_uses_minimal_tls_version_property_name()
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
                        ["tf.minimaltlsversion"] = "TLS1_2",
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
                  "minimalTlsVersion": "TLS1_0"
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
        mismatch.InventoryValue.Should().Be("TLS1_0");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_public_network_mismatch_when_inventory_property_is_json_boolean()
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
                        ["tf.public_network_access_enabled"] = "false",
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
                  "publicNetworkAccess": true
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
        mismatch.DeclarationValue.Should().Be("false");
        mismatch.InventoryValue.Should().Be("true");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_https_only_mismatch_when_declaration_uses_compacted_tf_enablehttpstrafficonly()
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
                        ["tf.enablehttpstrafficonly"] = "true",
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
                  "supportsHttpsTrafficOnly": false
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
        mismatch.DeclarationKey.Should().Be("tf.enablehttpstrafficonly");
        mismatch.DeclarationValue.Should().Be("true");
        mismatch.InventoryValue.Should().Be("false");
        mismatch.SecurityTheme.Should().Be("transport-security");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_https_only_mismatch_when_declaration_uses_enable_https_traffic_only()
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
                        ["tf.enable_https_traffic_only"] = "true",
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
                  "supportsHttpsTrafficOnly": false
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
        mismatch.DeclarationKey.Should().Be("tf.enable_https_traffic_only");
        mismatch.DeclarationValue.Should().Be("true");
        mismatch.InventoryValue.Should().Be("false");
        mismatch.SecurityTheme.Should().Be("transport-security");
        DeclarationInventoryContradictionThreeWayGate.DeclarationClaimsSecureControl(mismatch).Should().BeTrue();
    }

    [Fact]
    public void CompareQuality_Analyze_detects_public_network_access_mismatch_when_inventory_properties_bag_is_pascal_case()
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
                "Properties": {
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
    public void CompareQuality_Analyze_detects_public_network_access_mismatch_when_inventory_uses_arm_id()
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
                "type": "Microsoft.Storage/storageAccounts",
                "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod",
                "name": "stpayprod",
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
        mismatch.InventoryValue.Should().Be("Enabled");
        mismatch.DeclarationValue.Should().Be("Disabled");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_public_network_access_mismatch_when_inventory_is_resources_wrapper()
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
            {
              "resources": [
                {
                  "resourceType": "Microsoft.Storage/storageAccounts",
                  "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod",
                  "properties": {
                    "publicNetworkAccess": "Enabled"
                  }
                }
              ]
            }
            """;

        IReadOnlyList<DeclarationInventoryContradictionMismatch> mismatches =
            DeclarationInventoryContradictionAnalyzer.Analyze(
                InventoryTopologyCloudProvider.Azure,
                resourcesJson,
                graph);

        mismatches.Should().ContainSingle();
        mismatches[0].InventoryValue.Should().Be("Enabled");
        mismatches[0].DeclarationValue.Should().Be("Disabled");
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
    public void CompareQuality_Analyze_detects_public_network_mismatch_when_aws_declaration_uses_compacted_tf_publiclyaccessible()
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
                        ["tf.publiclyaccessible"] = "false",
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
                  "publiclyAccessible": true
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
        mismatch.DeclarationKey.Should().Be("tf.publiclyaccessible");
        mismatch.DeclarationValue.Should().Be("false");
        mismatch.InventoryValue.Should().Be("true");
        mismatch.SecurityTheme.Should().Be("data-protection");
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
    public void CompareQuality_Analyze_detects_network_acl_default_action_mismatch_when_inventory_nests_it_under_network_acls()
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
                  "networkAcls": {
                    "defaultAction": "Allow"
                  }
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
        mismatch.DeclarationValue.Should().Be("""{"defaultaction":"deny"}""");
        mismatch.InventoryValue.Should().Be("Allow");
        mismatch.SecurityTheme.Should().Be("network-isolation");
    }

    [Fact]
    public void CompareQuality_Analyze_accepts_network_acl_when_declaration_json_default_action_matches_nested_inventory()
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
                  "networkAcls": {
                    "defaultAction": "Deny"
                  }
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
    public void CompareQuality_Analyze_detects_min_tls_mismatch_when_inventory_nests_it_under_site_config()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "app-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "app-pay",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-pay",
                        ["tf.min_tls_version"] = "1.2",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Web/sites",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-pay",
                "properties": {
                  "siteConfig": {
                    "minTlsVersion": "1.0"
                  }
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
        mismatch.DeclarationKey.Should().Be("tf.min_tls_version");
        mismatch.DeclarationValue.Should().Be("1.2");
        mismatch.InventoryValue.Should().Be("1.0");
        mismatch.SecurityTheme.Should().Be("transport-security");
    }

    [Fact]
    public void CompareQuality_Analyze_does_not_flag_minimum_tls_when_declaration_1_2_matches_inventory_tls1_2()
    {
        // Older declarations store 1.2. ARM and azurerm storage inventory store TLS1_2.
        // DeclarationMinimumTlsVersion treats both as TLS 1.2.
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
                        ["tf.minimum_tls_version"] = "1.2",
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
                  "minimumTlsVersion": "TLS1_2"
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
    public void TryResolveSecurityTheme_returns_false_for_unknown_logical_name()
    {
        DeclarationInventorySecurityPropertyInventoryReader.TryResolveSecurityTheme(
            "NotARealProperty",
            out string theme).Should().BeFalse();

        theme.Should().BeEmpty();
    }

    [Fact]
    public void CompareQuality_Analyze_detects_mismatch_when_inventory_omits_public_network_access_but_declaration_disables()
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
                        ["tf.public_network_access_enabled"] = "false",
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
                  "supportsHttpsTrafficOnly": true
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
        mismatch.SecurityTheme.Should().Be("data-protection");
        mismatch.DeclarationValue.Should().Be("false");
        mismatch.InventoryValue.Should().Be("Enabled");
    }

    [Fact]
    public void CompareQuality_Analyze_skips_mismatch_when_inventory_public_network_access_is_secured_by_perimeter()
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
                  "publicNetworkAccess": "SecuredByPerimeter"
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
    public void CompareQuality_Analyze_detects_https_only_mismatch_when_inventory_uses_enable_https_traffic_only()
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
                        ["tf.supports_https_traffic_only"] = "true",
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
                  "enableHttpsTrafficOnly": false
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
        mismatch.DeclarationKey.Should().Be("tf.supports_https_traffic_only");
        mismatch.InventoryValue.Should().Be("false");
        mismatch.SecurityTheme.Should().Be("transport-security");
    }

    [Fact]
    public void CompareQuality_Analyze_does_not_mismatch_when_aws_declaration_uses_zero_and_inventory_publicly_accessible_is_false_string()
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
                        ["tf.publiclyaccessible"] = "0",
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
                  "publiclyAccessible": "false"
                }
              }
            ]
            """;

        IReadOnlyList<DeclarationInventoryContradictionMismatch> mismatches =
            DeclarationInventoryContradictionAnalyzer.Analyze(
                InventoryTopologyCloudProvider.Aws,
                resourcesJson,
                graph);

        mismatches.Should().BeEmpty();
    }

    [Fact]
    public void CompareQuality_Analyze_detects_public_network_mismatch_when_aws_declaration_uses_zero_and_inventory_is_public()
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
                        ["tf.publiclyaccessible"] = "0",
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
                  "publiclyAccessible": true
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
        mismatch.DeclarationValue.Should().Be("0");
        mismatch.InventoryValue.Should().Be("true");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_https_only_mismatch_when_gcp_declaration_uses_compacted_tf_requiressl()
    {
        const string resourceId = "projects/demo-project/instances/pay-sql";
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sql-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "pay-sql",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] = resourceId,
                        ["tf.requiressl"] = "true",
                    },
                },
            ],
        };

        string resourcesJson =
            $$"""
            [
              {
                "name": "{{resourceId}}",
                "assetType": "sqladmin.googleapis.com/Instance",
                "properties": {
                  "requireSsl": false
                }
              }
            ]
            """;

        IReadOnlyList<DeclarationInventoryContradictionMismatch> mismatches =
            DeclarationInventoryContradictionAnalyzer.Analyze(
                InventoryTopologyCloudProvider.Gcp,
                resourcesJson,
                graph);

        DeclarationInventoryContradictionMismatch mismatch = mismatches.Should().ContainSingle().Subject;
        mismatch.DeclarationKey.Should().Be("tf.requiressl");
        mismatch.DeclarationValue.Should().Be("true");
        mismatch.InventoryValue.Should().Be("false");
        mismatch.SecurityTheme.Should().Be("transport-security");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_public_network_mismatch_when_gcp_declaration_uses_compacted_tf_ipv4enabled()
    {
        const string resourceId = "projects/demo-project/instances/pay-sql";
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sql-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "pay-sql",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] = resourceId,
                        ["tf.ipv4enabled"] = "false",
                    },
                },
            ],
        };

        string resourcesJson =
            $$"""
            [
              {
                "name": "{{resourceId}}",
                "assetType": "sqladmin.googleapis.com/Instance",
                "properties": {
                  "ipv4Enabled": true
                }
              }
            ]
            """;

        IReadOnlyList<DeclarationInventoryContradictionMismatch> mismatches =
            DeclarationInventoryContradictionAnalyzer.Analyze(
                InventoryTopologyCloudProvider.Gcp,
                resourcesJson,
                graph);

        DeclarationInventoryContradictionMismatch mismatch = mismatches.Should().ContainSingle().Subject;
        mismatch.DeclarationKey.Should().Be("tf.ipv4enabled");
        mismatch.DeclarationValue.Should().Be("false");
        mismatch.InventoryValue.Should().Be("true");
        mismatch.SecurityTheme.Should().Be("data-protection");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_https_only_mismatch_when_gcp_inventory_nests_require_ssl_under_ip_configuration()
    {
        const string resourceId = "projects/demo-project/instances/pay-sql";
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sql-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "pay-sql",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] = resourceId,
                        ["tf.requiressl"] = "true",
                    },
                },
            ],
        };

        string resourcesJson =
            $$"""
            [
              {
                "name": "{{resourceId}}",
                "assetType": "sqladmin.googleapis.com/Instance",
                "properties": {
                  "settings": {
                    "ipConfiguration": {
                      "requireSsl": false
                    }
                  }
                }
              }
            ]
            """;

        IReadOnlyList<DeclarationInventoryContradictionMismatch> mismatches =
            DeclarationInventoryContradictionAnalyzer.Analyze(
                InventoryTopologyCloudProvider.Gcp,
                resourcesJson,
                graph);

        DeclarationInventoryContradictionMismatch mismatch = mismatches.Should().ContainSingle().Subject;
        mismatch.DeclarationKey.Should().Be("tf.requiressl");
        mismatch.InventoryValue.Should().Be("false");
        mismatch.SecurityTheme.Should().Be("transport-security");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_public_network_mismatch_when_gcp_inventory_nests_ipv4_enabled_under_ip_configuration()
    {
        const string resourceId = "projects/demo-project/instances/pay-sql";
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sql-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "pay-sql",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] = resourceId,
                        ["tf.ipv4_enabled"] = "false",
                    },
                },
            ],
        };

        string resourcesJson =
            $$"""
            [
              {
                "name": "{{resourceId}}",
                "assetType": "sqladmin.googleapis.com/Instance",
                "properties": {
                  "settings": {
                    "ipConfiguration": {
                      "ipv4Enabled": true
                    }
                  }
                }
              }
            ]
            """;

        IReadOnlyList<DeclarationInventoryContradictionMismatch> mismatches =
            DeclarationInventoryContradictionAnalyzer.Analyze(
                InventoryTopologyCloudProvider.Gcp,
                resourcesJson,
                graph);

        DeclarationInventoryContradictionMismatch mismatch = mismatches.Should().ContainSingle().Subject;
        mismatch.DeclarationKey.Should().Be("tf.ipv4_enabled");
        mismatch.DeclarationValue.Should().Be("false");
        mismatch.InventoryValue.Should().Be("true");
        mismatch.SecurityTheme.Should().Be("data-protection");
    }

    [Fact]
    public void CompareQuality_Analyze_detects_storage_encryption_mismatch_when_azure_declaration_uses_compacted_tf_encryptionenabled()
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
                        ["tf.encryptionenabled"] = "false",
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
                  "encryptionEnabled": true
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
        mismatch.DeclarationKey.Should().Be("tf.encryptionenabled");
        mismatch.DeclarationValue.Should().Be("false");
        mismatch.InventoryValue.Should().Be("true");
        mismatch.SecurityTheme.Should().Be("encryption");
    }

    [Fact]
    public void CompareQuality_Analyze_does_not_mismatch_when_declaration_uses_no_and_inventory_public_network_access_is_disabled()
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
                        ["tf.public_network_access"] = "no",
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
                  "publicNetworkAccess": "Disabled"
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
