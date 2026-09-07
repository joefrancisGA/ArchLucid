using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Category", "Unit")]
public sealed class DanglingDeclarationReferenceFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_emits_finding_when_key_vault_uri_is_not_declared()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "func-checkout",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "checkout-func",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["appSettings"] =
                            "KeyVaultUri=https://payments-kv.vault.azure.net/secrets/db-connection",
                    },
                },
            ],
        };

        DanglingDeclarationReferenceFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("dangling-declaration-reference");
        finding.Title.Should().Contain("payments-kv");
        finding.Trace!.Notes.Should().Contain("evidence:graph-node:func-checkout");

        DanglingDeclarationReferenceFindingPayload payload =
            finding.Payload.Should().BeOfType<DanglingDeclarationReferenceFindingPayload>().Subject;

        payload.ReferenceKind.Should().Be(DanglingDeclarationReferenceKind.KeyVaultUri);
        payload.SourceNodeId.Should().Be("func-checkout");
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_key_vault_node_is_present()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "func-checkout",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "checkout-func",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["appSettings"] =
                            "KeyVaultUri=https://payments-kv.vault.azure.net/secrets/db-connection",
                    },
                },
                new GraphNode
                {
                    NodeId = "payments-kv",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "payments-kv",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["name"] = "payments-kv",
                    },
                },
            ],
        };

        DanglingDeclarationReferenceFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_for_parameter_expression()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "func-checkout",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "checkout-func",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["keyVaultUri"] = "[parameters('vaultUri')]",
                    },
                },
            ],
        };

        DanglingDeclarationReferenceFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public void Analyze_emits_finding_for_dangling_arm_id()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "func-checkout",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "checkout-func",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["storageAccountId"] =
                            "/subscriptions/00000000-0000-0000-0000-000000000001/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/missingstore",
                    },
                },
            ],
        };

        IReadOnlyList<DanglingDeclarationReference> references = DanglingDeclarationReferenceAnalyzer.Analyze(graph);

        references.Should().ContainSingle(reference => reference.ReferenceKind == DanglingDeclarationReferenceKind.ArmId);
    }
}
