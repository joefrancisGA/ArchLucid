using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Category", "Unit")]
public sealed class IdentityBlastRadiusFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_emits_finding_for_actor_contributor_keyvault_fixture()
    {
        GraphSnapshot graph = BuildActorContributorKeyVaultFixture();

        IdentityBlastRadiusFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("identity-blast-radius");
        finding.Category.Should().Be("Security");
        finding.Title.Should().Contain("checkout-func");
        finding.Title.Should().Contain("Contributor");
        finding.Title.Should().Contain("kv-pay-prod");
        finding.Trace!.Notes.Should().Contain("evidence:graph-node:kv-pay-prod");

        IdentityBlastRadiusFindingPayload payload =
            finding.Payload.Should().BeOfType<IdentityBlastRadiusFindingPayload>().Subject;

        payload.ActorNodeId.Should().Be("actor-checkout");
        payload.DatastoreNodeId.Should().Be("kv-pay-prod");
        payload.RoleName.Should().Be("Contributor");
        payload.HopCount.Should().Be(2);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_role_path_missing()
    {
        GraphSnapshot graph = BuildActorContributorKeyVaultFixture(includeRoleToKeyVault: false);

        IdentityBlastRadiusFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    private static GraphSnapshot BuildActorContributorKeyVaultFixture(bool includeRoleToKeyVault = true)
    {
        GraphNode actor = new()
        {
            NodeId = "actor-checkout",
            NodeType = GraphNodeTypes.Actor,
            Label = "checkout-func",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["kind"] = nameof(ActorKind.Machine),
                ["trustOrigin"] = nameof(TrustOrigin.Internal),
            },
        };

        GraphNode roleAssignment = new()
        {
            NodeId = "role-contrib-kv",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "checkout-contributor-kv",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_role_assignment",
                ["roleName"] = "Contributor",
            },
        };

        GraphNode keyVault = new()
        {
            NodeId = "kv-pay-prod",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "kv-pay-prod",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["category"] = GraphTopologyCategories.Storage,
                [CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.DataBearing,
            },
        };

        List<GraphEdge> edges =
        [
            new GraphEdge
            {
                FromNodeId = actor.NodeId,
                ToNodeId = roleAssignment.NodeId,
                EdgeType = GraphEdgeTypes.RelatesTo,
                Weight = 1.0,
            },
        ];

        if (includeRoleToKeyVault)
        {
            edges.Add(new GraphEdge
            {
                FromNodeId = roleAssignment.NodeId,
                ToNodeId = keyVault.NodeId,
                EdgeType = GraphEdgeTypes.AppliesTo,
                Weight = 1.0,
            });
        }

        return new GraphSnapshot
        {
            Nodes = [actor, roleAssignment, keyVault],
            Edges = edges,
        };
    }
}
