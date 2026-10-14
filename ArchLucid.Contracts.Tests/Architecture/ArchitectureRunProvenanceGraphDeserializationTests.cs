using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureRunProvenanceGraphDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              "nodes": null,
              "edges": null,
              "timeline": null,
              "traceabilityGaps": null
            }
            """;

        ArchitectureRunProvenanceGraph graph =
            JsonSerializer.Deserialize<ArchitectureRunProvenanceGraph>(json, ContractJson.Default)!;

        graph.Nodes.Should().NotBeNull().And.BeEmpty();
        graph.Edges.Should().NotBeNull().And.BeEmpty();
        graph.Timeline.Should().NotBeNull().And.BeEmpty();
        graph.TraceabilityGaps.Should().NotBeNull().And.BeEmpty();
    }
}
