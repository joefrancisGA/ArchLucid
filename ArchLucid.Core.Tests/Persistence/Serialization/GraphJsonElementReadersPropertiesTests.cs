using System.Text.Json;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Serialization;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Persistence.Serialization;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GraphJsonElementReadersPropertiesTests
{
    [Fact]
    public void ReadProperties_numeric_only_values_coerce_to_strings()
    {
        const string json =
            """{"nodeId":"n1","nodeType":"t","label":"l","properties":{"resourceId":12345}}""";

        JsonSerializerOptions options = new();
        options.Converters.Add(new GraphNodeJsonConverter());

        GraphNode? node = JsonSerializer.Deserialize<GraphNode>(json, options);

        node.Should().NotBeNull();
        node!.Properties.Should().ContainKey("resourceId").WhoseValue.Should().Be("12345");
    }

    [Fact]
    public void ReadProperties_boolean_values_coerce_to_strings()
    {
        const string json =
            """{"nodeId":"n1","nodeType":"t","label":"l","properties":{"enabled":true,"region":"eastus"}}""";

        JsonSerializerOptions options = new();
        options.Converters.Add(new GraphNodeJsonConverter());

        GraphNode? node = JsonSerializer.Deserialize<GraphNode>(json, options);

        node.Should().NotBeNull();
        node!.Properties.Should().HaveCount(2);
        node.Properties.Should().ContainKey("enabled").WhoseValue.Should().Be("true");
        node.Properties.Should().ContainKey("region").WhoseValue.Should().Be("eastus");
    }

    [Fact]
    public void ReadProperties_null_values_coerce_to_empty_strings()
    {
        const string json =
            """{"nodeId":"n1","nodeType":"t","label":"l","properties":{"region":null,"name":"eastus"}}""";

        JsonSerializerOptions options = new();
        options.Converters.Add(new GraphNodeJsonConverter());

        GraphNode? node = JsonSerializer.Deserialize<GraphNode>(json, options);

        node.Should().NotBeNull();
        node!.Properties.Should().HaveCount(2);
        node.Properties.Should().ContainKey("region").WhoseValue.Should().BeEmpty();
        node.Properties.Should().ContainKey("name").WhoseValue.Should().Be("eastus");
    }
}
