using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

internal static class GoldenCorpusInventoryContradictionGraphFactory
{
    internal const string StorageArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod";

    internal static readonly Guid Case37RunId = Guid.Parse("20000000-0000-4000-8000-000000000037");

    internal static readonly Guid Case37ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000037");

    internal static readonly Guid Case37AzurePackageId = Guid.Parse("30000000-0000-4000-8000-000000000037");

    internal static readonly Guid Case73RunId = Guid.Parse("20000000-0000-4000-8000-000000000073");

    internal static readonly Guid Case73ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000073");

    internal static readonly Guid Case73AzurePackageId = Guid.Parse("30000000-0000-4000-8000-000000000073");

    internal const string CisAzurePublicAccessRuleId = "cis-az-006";

    internal static GraphSnapshot CreateDeclarationDisabledInventoryEnabledGraph()
    {
        return new GraphSnapshot
        {
            SchemaVersion = 1,
            GraphSnapshotId = Guid.Parse("00000037-0000-4000-8000-000000000037"),
            ContextSnapshotId = Case37ContextSnapshotId,
            RunId = Case37RunId,
            CreatedUtc = new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "storage-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "stpayprod",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] = StorageArmId,
                        ["tf.public_network_access"] = "Disabled",
                    },
                },
            ],
        };
    }

    internal static GoldenCorpusInventoryFixtureDocument CreateMismatchInventoryFixture()
    {
        return new GoldenCorpusInventoryFixtureDocument
        {
            AzurePackageId = Case37AzurePackageId,
            ResourcesJson =
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
                """,
        };
    }

    internal static GraphSnapshot CreateCase73DeclarationDisabledInventoryEnabledGraph()
    {
        return new GraphSnapshot
        {
            SchemaVersion = 1,
            GraphSnapshotId = Guid.Parse("00000073-0000-4000-8000-000000000073"),
            ContextSnapshotId = Case73ContextSnapshotId,
            RunId = Case73RunId,
            CreatedUtc = new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "storage-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "stpayprod",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] = StorageArmId,
                        ["tf.public_network_access"] = "Disabled",
                    },
                },
            ],
        };
    }

    internal static GoldenCorpusInventoryFixtureDocument CreateCase73MismatchInventoryFixture()
    {
        return new GoldenCorpusInventoryFixtureDocument
        {
            AzurePackageId = Case73AzurePackageId,
            ResourcesJson =
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
                """,
        };
    }

    internal static GoldenCorpusAssignedPackFixtureDocument CreateCase73AssignedPackFixture()
    {
        return new GoldenCorpusAssignedPackFixtureDocument
        {
            ComplianceRuleKeys = [CisAzurePublicAccessRuleId],
        };
    }
}
