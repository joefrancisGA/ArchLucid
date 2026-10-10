using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotGraphEdgeAppenderSelfEdgeTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Self_edges_require_explicit_opt_in(bool allow)
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        GraphEdge? result = AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, "same", "same", "type", "source",
            allowSelfEdges: allow);
        if (allow)
        {
            Assert.Same(Assert.Single(edges), result);
            Assert.Equal("same|same|type", Assert.Single(keys));
            Assert.Equal("edge-same|same|type", result!.EdgeId);
            Assert.Equal("same", result.FromNodeId);
            Assert.Equal("same", result.ToNodeId);
        }
        else
        {
            Assert.Null(result);
            Assert.Empty(edges);
            Assert.Empty(keys);
        }
    }

    [Fact]
    public void Opted_in_self_edge_still_keeps_first_duplicate_when_promotion_is_disabled()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        GraphEdge? original = AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, "same", "same", "type", "first",
            provenanceKind: "DerivedFact", promoteStrongerProvenance: false, allowSelfEdges: true);
        Assert.NotNull(original);
        original.Properties["target"] = "first target";
        Assert.Null(AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, "same", "same", "type", "second",
            provenanceKind: "ObservedFact", promoteStrongerProvenance: false, allowSelfEdges: true));
        Assert.Same(original, Assert.Single(edges));
        Assert.Single(keys);
        Assert.Equal("first", original.InferenceSource);
        Assert.Equal("DerivedFact", original.ProvenanceKind);
        Assert.Equal("first target", original.Properties["target"]);
    }
}
