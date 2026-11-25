using System.Text.Json;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Serialization;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Persistence.Serialization;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GraphNodeJsonConverterTests
{
    [Theory]
    [InlineData("9007199254740993.0", "9007199254740993")]
    [InlineData("\"9.007199254740993e15\"", "9007199254740993")]
    [InlineData("9223372036854775807.0", "9223372036854775807")]
    [InlineData("9223372036854775808.0", "9223372036854775808.0")]
    [InlineData("42.000000000000000000000000000001", "42.000000000000000000000000000001")]
    public void Read_preserves_id_precision_across_node_and_property_tokens(string token, string expected)
    {
        string json = $$"""{"nodeId":{{token}},"properties":{"resourceId":{{token}} } }""";

        GraphNode? node = JsonSerializer.Deserialize<GraphNode>(json, GraphJsonSerialization.EntityJsonOptions);

        node.Should().NotBeNull();
        node!.NodeId.Should().Be(expected);
        node.Properties["resourceId"].Should().Be(expected);
    }

    [Fact]
    public void Read_numeric_nodeId_and_sourceId_coerce_to_strings()
    {
        const string json =
            """{"nodeId":12345,"nodeType":"TopologyResource","label":"api","sourceId":9876543210}""";

        JsonSerializerOptions options = new();
        options.Converters.Add(new GraphNodeJsonConverter());

        GraphNode? node = JsonSerializer.Deserialize<GraphNode>(json, options);

        node.Should().NotBeNull();
        node!.NodeId.Should().Be("12345");
        node.SourceId.Should().Be("9876543210");
    }

    [Fact]
    public void Read_boolean_nodeId_coerces_to_string()
    {
        const string json =
            """{"nodeId":true,"nodeType":"TopologyResource","label":"api"}""";

        JsonSerializerOptions options = new();
        options.Converters.Add(new GraphNodeJsonConverter());

        GraphNode? node = JsonSerializer.Deserialize<GraphNode>(json, options);

        node.Should().NotBeNull();
        node!.NodeId.Should().Be("true");
    }

    [Fact]
    public void Read_string_encoded_boolean_nodeId_coerces_to_lowercase_string()
    {
        const string json =
            """{"nodeId":"True","nodeType":"TopologyResource","label":"api"}""";

        JsonSerializerOptions options = new();
        options.Converters.Add(new GraphNodeJsonConverter());

        GraphNode? node = JsonSerializer.Deserialize<GraphNode>(json, options);

        node.Should().NotBeNull();
        node!.NodeId.Should().Be("true");
    }

    [Fact]
    public void Read_string_encoded_whole_number_double_nodeId_coerces_to_string()
    {
        const string json =
            """{"nodeId":"42.0","nodeType":"TopologyResource","label":"api"}""";

        JsonSerializerOptions options = new();
        options.Converters.Add(new GraphNodeJsonConverter());

        GraphNode? node = JsonSerializer.Deserialize<GraphNode>(json, options);

        node.Should().NotBeNull();
        node!.NodeId.Should().Be("42");
    }

    [Fact]
    public void Read_whole_number_double_nodeId_coerces_to_string()
    {
        const string json =
            """{"nodeId":42.0,"nodeType":"TopologyResource","label":"api"}""";

        JsonSerializerOptions options = new();
        options.Converters.Add(new GraphNodeJsonConverter());

        GraphNode? node = JsonSerializer.Deserialize<GraphNode>(json, options);

        node.Should().NotBeNull();
        node!.NodeId.Should().Be("42");
    }
}
