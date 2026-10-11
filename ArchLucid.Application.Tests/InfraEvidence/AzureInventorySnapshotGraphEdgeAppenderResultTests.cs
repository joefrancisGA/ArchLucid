using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotGraphEdgeAppenderResultTests
{
    [Fact]
    public void Insert_returns_the_exact_edge_added_to_the_collection()
    {
        List<GraphEdge> edges = [];
        GraphEdge? result = AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, new(StringComparer.Ordinal), "from", "to", "type", "source");
        Assert.Same(Assert.Single(edges), result);
        result!.Properties["evidence"] = "attached";
        Assert.Equal("attached", edges[0].Properties["evidence"]);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Rejected_duplicate_returns_null_and_preserves_existing_object(bool promote)
    {
        GraphEdge original = new() { FromNodeId = "from", ToNodeId = "to", EdgeType = "type", ProvenanceKind = "ObservedFact" };
        List<GraphEdge> edges = [original];
        HashSet<string> keys = new(StringComparer.Ordinal) { "from|to|type" };
        GraphEdge? result = AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, "from", "to", "type", "source",
            provenanceKind: "HumanAssertion", promoteStrongerProvenance: promote);
        Assert.Null(result);
        Assert.Same(original, Assert.Single(edges));
    }

    [Fact]
    public void Promotion_returns_the_replacement_at_the_original_index()
    {
        GraphEdge unrelated = new() { FromNodeId = "other", ToNodeId = "to", EdgeType = "type" };
        GraphEdge original = new() { FromNodeId = "from", ToNodeId = "to", EdgeType = "type", ProvenanceKind = "DerivedFact" };
        List<GraphEdge> edges = [unrelated, original];
        GraphEdge? result = AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, new(StringComparer.Ordinal) { "from|to|type" },
            "from", "to", "type", "source", provenanceKind: "ObservedFact");
        Assert.Equal(2, edges.Count);
        Assert.Same(unrelated, edges[0]);
        Assert.NotSame(original, result);
        Assert.Same(edges[1], result);
        Assert.Equal("ObservedFact", result!.ProvenanceKind);
    }

    [Fact]
    public void Key_without_edge_returns_null()
    {
        List<GraphEdge> edges = [];
        GraphEdge? result = AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, new(StringComparer.Ordinal) { "from|to|type" },
            "from", "to", "type", "source");
        Assert.Null(result);
        Assert.Empty(edges);
    }

    [Theory]
    [InlineData("same", "same", "type")]
    [InlineData(" ", "to", "type")]
    [InlineData("from", "to", " ")]
    public void Invalid_or_self_edge_returns_null(string from, string to, string type)
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Assert.Null(AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, from, to, type, "source"));
        Assert.Empty(edges);
        Assert.Empty(keys);
    }
}
