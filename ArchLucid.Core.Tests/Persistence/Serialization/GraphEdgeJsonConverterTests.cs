using System.Text.Json;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Serialization;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Persistence.Serialization;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GraphEdgeJsonConverterTests
{
    [Fact]
    public void Read_boolean_weight_coerces_to_zero_or_one()
    {
        const string json =
            """{"edgeId":"e1","fromNodeId":"a","toNodeId":"b","edgeType":"dependsOn","weight":false}""";

        JsonSerializerOptions options = new();
        options.Converters.Add(new GraphEdgeJsonConverter());

        GraphEdge? edge = JsonSerializer.Deserialize<GraphEdge>(json, options);

        edge.Should().NotBeNull();
        edge!.Weight.Should().Be(0.0);
    }

    [Fact]
    public void Read_string_encoded_boolean_weight_coerces_to_zero()
    {
        const string json =
            """{"edgeId":"e1","fromNodeId":"a","toNodeId":"b","edgeType":"dependsOn","weight":"false"}""";

        JsonSerializerOptions options = new();
        options.Converters.Add(new GraphEdgeJsonConverter());

        GraphEdge? edge = JsonSerializer.Deserialize<GraphEdge>(json, options);

        edge.Should().NotBeNull();
        edge!.Weight.Should().Be(0.0);
    }

    [Fact]
    public void Read_write_round_trips_provenance_kind_and_declared_connection_id()
    {
        const string json =
            """
            {
              "edgeId":"e1",
              "fromNodeId":"a",
              "toNodeId":"b",
              "edgeType":"connectsTo",
              "provenanceKind":"HumanAssertion",
              "inferenceSource":"human-declared-connection",
              "declaredConnectionId":"cccccccc-cccc-cccc-cccc-cccccccccccc"
            }
            """;

        JsonSerializerOptions options = new();
        options.Converters.Add(new GraphEdgeJsonConverter());

        GraphEdge? edge = JsonSerializer.Deserialize<GraphEdge>(json, options);

        edge.Should().NotBeNull();
        edge!.ProvenanceKind.Should().Be("HumanAssertion");
        edge.InferenceSource.Should().Be("human-declared-connection");
        edge.DeclaredConnectionId.Should().Be("cccccccc-cccc-cccc-cccc-cccccccccccc");

        string reserialized = JsonSerializer.Serialize(edge, options);
        GraphEdge? roundTrip = JsonSerializer.Deserialize<GraphEdge>(reserialized, options);

        roundTrip.Should().NotBeNull();
        roundTrip!.ProvenanceKind.Should().Be("HumanAssertion");
        roundTrip.DeclaredConnectionId.Should().Be("cccccccc-cccc-cccc-cccc-cccccccccccc");
    }

    [Fact]
    public void Read_missing_provenance_kind_deserializes_as_null()
    {
        const string json =
            """{"edgeId":"e1","fromNodeId":"a","toNodeId":"b","edgeType":"connectsTo","inferenceSource":"inventory-nic-subnet"}""";

        JsonSerializerOptions options = new();
        options.Converters.Add(new GraphEdgeJsonConverter());

        GraphEdge? edge = JsonSerializer.Deserialize<GraphEdge>(json, options);

        edge.Should().NotBeNull();
        edge!.ProvenanceKind.Should().BeNull();
        edge.DeclaredConnectionId.Should().BeNull();
    }
}
