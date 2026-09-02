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
}
