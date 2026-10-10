using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotGraphEdgeAppenderTests
{
    [Theory]
    [InlineData(null, null, "CONNECTS_TO", "ObservedFact")]
    [InlineData(" ", " ", "CONNECTS_TO", "ObservedFact")]
    [InlineData("custom label", "HumanAssertion", "custom label", "HumanAssertion")]
    public void New_edge_has_stable_identity_and_expected_defaults(string? label, string? provenance, string expectedLabel, string expectedProvenance)
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, "from", "to", "CONNECTS_TO", "source", label, provenance);
        GraphEdge edge = Assert.Single(edges);
        Assert.Equal("edge-from|to|CONNECTS_TO", edge.EdgeId);
        Assert.Equal("from", edge.FromNodeId);
        Assert.Equal("to", edge.ToNodeId);
        Assert.Equal("CONNECTS_TO", edge.EdgeType);
        Assert.Equal(expectedLabel, edge.Label);
        Assert.Equal(expectedProvenance, edge.ProvenanceKind);
        Assert.Equal("source", edge.InferenceSource);
        Assert.Equal(1d, edge.Weight);
        Assert.Equal("from|to|CONNECTS_TO", Assert.Single(keys));
    }

    [Theory]
    [InlineData("DeterministicInference", "DerivedFact", true)]
    [InlineData("DeterministicInference", "HumanAssertion", true)]
    [InlineData("DeterministicInference", "ObservedFact", true)]
    [InlineData("DerivedFact", "HumanAssertion", true)]
    [InlineData("DerivedFact", "ObservedFact", true)]
    [InlineData("HumanAssertion", "ObservedFact", true)]
    [InlineData("ObservedFact", "HumanAssertion", false)]
    [InlineData("HumanAssertion", "DerivedFact", false)]
    [InlineData("DerivedFact", "DeterministicInference", false)]
    [InlineData("ObservedFact", "ObservedFact", false)]
    [InlineData("HumanAssertion", "HumanAssertion", false)]
    [InlineData("DerivedFact", "DerivedFact", false)]
    [InlineData("DeterministicInference", "DeterministicInference", false)]
    [InlineData("unknown", "ObservedFact", true)]
    [InlineData("ObservedFact", "unknown", false)]
    [InlineData("unknown", null, false)]
    [InlineData("unknown", " ", false)]
    public void Duplicate_keeps_existing_unless_incoming_provenance_is_stronger(string existingProvenance, string? incomingProvenance, bool replace)
    {
        GraphEdge first = new() { EdgeId = "first", FromNodeId = "a", ToNodeId = "b", EdgeType = "other" };
        GraphEdge existing = new()
        {
            EdgeId = "existing", FromNodeId = "from", ToNodeId = "to", EdgeType = "CONNECTS_TO",
            Label = "old", InferenceSource = "old-source", ProvenanceKind = existingProvenance,
            Weight = 0.5d, DeclaredConnectionId = "declaration",
        };
        existing.Properties["evidence"] = "old-evidence";
        List<GraphEdge> edges = [first, existing];
        HashSet<string> keys = new(StringComparer.Ordinal) { "from|to|CONNECTS_TO" };

        AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, "from", "to", "CONNECTS_TO", "new-source", "new-label", incomingProvenance);

        Assert.Equal(2, edges.Count);
        Assert.Same(first, edges[0]);
        Assert.Single(keys);
        if (replace)
        {
            Assert.NotSame(existing, edges[1]);
            Assert.Equal("edge-from|to|CONNECTS_TO", edges[1].EdgeId);
            Assert.Equal("new-label", edges[1].Label);
            Assert.Equal("new-source", edges[1].InferenceSource);
            Assert.Equal(incomingProvenance, edges[1].ProvenanceKind);
            Assert.Equal(1d, edges[1].Weight);
            // Characterizes existing replacement semantics; evidence merging is a separate behavior change.
            Assert.Null(edges[1].DeclaredConnectionId);
            Assert.Empty(edges[1].Properties);
        }
        else
        {
            Assert.Same(existing, edges[1]);
            Assert.Equal("old-evidence", edges[1].Properties["evidence"]);
            Assert.Equal("declaration", edges[1].DeclaredConnectionId);
            Assert.Equal(0.5d, edges[1].Weight);
        }
    }

    [Theory]
    [InlineData("", "to", "type")]
    [InlineData(" ", "to", "type")]
    [InlineData("from", "", "type")]
    [InlineData("from", " ", "type")]
    [InlineData("from", "to", "")]
    [InlineData("from", "to", " ")]
    [InlineData("same", "same", "type")]
    public void Invalid_or_self_edge_does_not_change_collections(string from, string to, string type)
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, from, to, type, "source");
        Assert.Empty(edges);
        Assert.Empty(keys);
    }

    [Fact]
    public void Existing_key_without_matching_edge_does_not_create_edge()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal) { "from|to|type" };
        AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, "from", "to", "type", "source", provenanceKind: "ObservedFact");
        Assert.Empty(edges);
        Assert.Single(keys);
    }

    [Fact]
    public void Direction_and_type_are_part_of_duplicate_identity()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, "a", "b", "one", "source");
        AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, "b", "a", "one", "source");
        AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, "a", "b", "two", "source");
        Assert.Equal(3, edges.Count);
        Assert.Equal(3, keys.Count);
    }
}
