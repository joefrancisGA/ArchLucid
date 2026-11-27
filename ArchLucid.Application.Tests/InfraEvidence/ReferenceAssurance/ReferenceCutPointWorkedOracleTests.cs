namespace ArchLucid.Application.Tests.InfraEvidence.ReferenceAssurance;

[Trait("Suite", "Application")]
[Trait("Category", "Unit")]
public sealed class ReferenceCutPointWorkedOracleTests
{
    [Fact]
    public void Counts_distinct_path_ids_not_number_of_hop_occurrences()
    {
        // Counting set membership by hand: p occurs in A and B, q only in B.
        // The repeated p→q hop in B does not add another path to any count.
        (string, string, string) pq = ("p", "link", "q");
        Dictionary<Guid, IReadOnlyList<(string FromNodeId, string EdgeType, string ToNodeId)>> paths = new()
        {
            [Guid.Parse("00000000-0000-0000-0000-000000000001")] = [("p", "link", "r")],
            [Guid.Parse("00000000-0000-0000-0000-000000000002")] = [pq, pq],
            [Guid.Parse("00000000-0000-0000-0000-000000000003")] = [],
        };

        IReadOnlyDictionary<string, int> actual = ReferenceCutPointOracle.CountCollapsedPaths(paths);
        Assert.Equal(5, actual.Count);
        Assert.Equal(2, actual["node:p"]);
        Assert.Equal(1, actual["node:q"]);
        Assert.Equal(1, actual["node:r"]);
        Assert.Equal(1, actual["edge:p|link|q"]);
        Assert.Equal(1, actual["edge:p|link|r"]);
    }

    [Fact]
    public void Empty_path_set_has_no_candidates()
    {
        Assert.Empty(ReferenceCutPointOracle.CountCollapsedPaths(
            new Dictionary<Guid, IReadOnlyList<(string FromNodeId, string EdgeType, string ToNodeId)>>()));
    }
}
