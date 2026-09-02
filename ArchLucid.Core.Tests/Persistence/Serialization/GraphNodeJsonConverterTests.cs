using System.Text.Json;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Serialization;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Persistence.Serialization;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GraphNodeJsonConverterTests
{
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
}
