using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Materialization;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class RequestActorMaterializerTests
{
    [Fact]
    public void MaterializeFromActorsJson_returns_empty_when_json_missing()
    {
        RequestActorMaterializer.MaterializeFromActorsJson(null, Guid.NewGuid()).Should().BeEmpty();
    }

    [Fact]
    public void MaterializeFromActorsJson_emits_actor_and_trust_boundary_for_external_actor()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        string actorsJson =
            """
            [
              {
                "label": "Partner portal user",
                "kind": "Human",
                "trustOrigin": "External",
                "contract": "Sync",
                "origin": "Asserted",
                "confidence": 100
              }
            ]
            """;

        IReadOnlyList<GraphNode> nodes =
            RequestActorMaterializer.MaterializeFromActorsJson(actorsJson, snapshotId);

        nodes.Should().HaveCount(2);
        nodes.Should().Contain(n => n.NodeType == GraphNodeTypes.Actor && n.Label == "Partner portal user");
        nodes.Should().Contain(n =>
            n.NodeType == GraphNodeTypes.TrustBoundary
            && n.Properties["actorNodeId"] == $"actor-{snapshotId:N}-1");
    }

    [Fact]
    public void MaterializeFromActorsJson_emits_actor_only_for_internal_actor()
    {
        string actorsJson =
            """
            [
              {
                "label": "Ops engineer",
                "kind": "Human",
                "trustOrigin": "Internal",
                "contract": "Sync",
                "origin": "Asserted",
                "confidence": 100
              }
            ]
            """;

        IReadOnlyList<GraphNode> nodes =
            RequestActorMaterializer.MaterializeFromActorsJson(actorsJson, Guid.NewGuid());

        nodes.Should().ContainSingle();
        nodes[0].NodeType.Should().Be(GraphNodeTypes.Actor);
    }

    [Theory]
    [InlineData("[{}]")]
    [InlineData("""[{"kind":"Human","contract":"Sync","origin":"Asserted"}]""")]
    [InlineData("""[{"kind":"Human","trustOrigin":"External","contract":"Sync"}]""")]
    [InlineData("""[{"kind":"Human","trustOrigin":2147483647,"contract":"Sync","origin":"Asserted"}]""")]
    [InlineData("[null]")]
    [InlineData("null")]
    [InlineData("[")]
    public void MaterializeFromActorsJson_rejects_incomplete_or_corrupt_actor_evidence(string raw)
    {
        Action read = () => RequestActorMaterializer.MaterializeFromActorsJson(raw, Guid.NewGuid());
        read.Should().Throw<System.Text.Json.JsonException>();
    }
}
