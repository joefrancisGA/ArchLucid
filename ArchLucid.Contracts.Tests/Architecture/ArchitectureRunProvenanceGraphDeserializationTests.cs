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

    [Fact]
    public void Deserialize_null_linkage_metadata_yields_empty_ordinal_ignore_case_dictionaries_not_null()
    {
        const string json = """
            {
              "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              "nodes": [
                {
                  "id": "n1",
                  "type": "task",
                  "referenceId": "r1",
                  "name": "task",
                  "metadata": null
                }
              ],
              "edges": [
                {
                  "id": "e1",
                  "type": "contains",
                  "fromNodeId": "n1",
                  "toNodeId": "n1",
                  "metadata": null
                }
              ],
              "timeline": [
                {
                  "timestampUtc": "2026-01-01T00:00:00Z",
                  "kind": "event",
                  "label": "label",
                  "metadata": null
                }
              ]
            }
            """;

        ArchitectureRunProvenanceGraph graph =
            JsonSerializer.Deserialize<ArchitectureRunProvenanceGraph>(json, ContractJson.Default)!;

        ArchitectureLinkageNode node = graph.Nodes[0];
        node.Metadata.Should().NotBeNull().And.BeEmpty();
        node.Metadata["AgentType"] = "topology";
        node.Metadata.Should().ContainKey("agenttype");

        ArchitectureLinkageEdge edge = graph.Edges[0];
        edge.Metadata.Should().NotBeNull().And.BeEmpty();
        edge.Metadata["Kind"] = "contains";
        edge.Metadata.Should().ContainKey("kind");

        ArchitectureTraceTimelineEntry entry = graph.Timeline[0];
        entry.Metadata.Should().NotBeNull().And.BeEmpty();
        entry.Metadata["Phase"] = "start";
        entry.Metadata.Should().ContainKey("phase");
    }
}
