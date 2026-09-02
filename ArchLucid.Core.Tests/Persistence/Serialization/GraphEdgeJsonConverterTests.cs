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
}
