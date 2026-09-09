using ArchLucid.Application.Analysis;
using ArchLucid.Application.Findings.ProseAssumption;
using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class ProseAssumptionContradictionPassTests
{
    private const string StorageArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod";

    [Fact]
    public void Analyze_emits_match_when_prose_requires_private_and_inventory_is_public()
    {
        GraphSnapshot graph = CreateStorageGraph();

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

        List<ProseAssumptionCandidate> candidates =
        [
            new()
            {
                Statement = "The storage account must not be public.",
                DocumentPath = "architecture.md",
                LineNumber = 1,
                QuotedSpan = "must not be public",
                LogicalPropertyName = DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                ImpliedPropertyValue = "Disabled",
            },
        ];

        IReadOnlyList<ProseAssumptionContradictionMatch> matches = ProseAssumptionContradictionPass.Analyze(
            InventoryTopologyCloudProvider.Azure,
            resourcesJson,
            graph,
            candidates,
            maxFindings: 8);

        ProseAssumptionContradictionMatch match = matches.Should().ContainSingle().Subject;
        match.InventoryValue.Should().Be("Enabled");
        match.Candidate.EvidenceRef.Should().Be("doc:architecture.md#L1");
    }

    [Fact]
    public void Analyze_returns_empty_for_unmapped_candidate()
    {
        GraphSnapshot graph = CreateStorageGraph();

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

        List<ProseAssumptionCandidate> candidates =
        [
            new()
            {
                Statement = "The payment provider owns PCI scope.",
                DocumentPath = "architecture.md",
                LineNumber = 1,
                QuotedSpan = "owns PCI scope",
            },
        ];

        ProseAssumptionContradictionPass.Analyze(
            InventoryTopologyCloudProvider.Azure,
            resourcesJson,
            graph,
            candidates,
            maxFindings: 8).Should().BeEmpty();
    }

    private static GraphSnapshot CreateStorageGraph() => new()
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
                    ["resourceId"] = StorageArmId,
                },
            },
        ],
    };
}
