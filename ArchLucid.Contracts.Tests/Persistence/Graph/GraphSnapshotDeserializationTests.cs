using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Graph;

[Trait("Category", "Unit")]
public sealed class GraphSnapshotDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "nodes": null,
              "edges": null,
              "warnings": null
            }
            """;

        GraphSnapshot? result = JsonSerializer.Deserialize<GraphSnapshot>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Nodes.Should().NotBeNull().And.BeEmpty();
        result.Edges.Should().NotBeNull().And.BeEmpty();
        result.Warnings.Should().NotBeNull().And.BeEmpty();
    }
}
