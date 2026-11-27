namespace ArchLucid.Application.Tests.InfraEvidence.ReferenceAssurance;

[Trait("Suite", "Application")]
[Trait("Category", "Unit")]
public sealed class ReferenceReachabilityBoundaryOracleTests
{
    [Theory]
    [InlineData(0, false, false)]
    [InlineData(1, true, false)]
    [InlineData(2, true, true)]
    [InlineData(3, true, true)]
    public void Simple_walk_reference_includes_terminals_at_its_edge_budget_but_never_revisits_nodes(
        int edgeBudget,
        bool reachesB,
        bool reachesC)
    {
        // A → B → C → A, with B and C as terminals and D disconnected.
        // Enumerate the two permitted paths by hand, without using Signature().
        Dictionary<string, IReadOnlyList<(string ToNodeId, string EdgeType)>> outgoing = new()
        {
            ["A"] = [("B", "link")],
            ["B"] = [("C", "link")],
            ["C"] = [("A", "link")],
        };
        List<string> expected = [];

        if (reachesB)
        {
            expected.Add("A|link|B");
        }

        if (reachesC)
        {
            expected.Add("A|link|B>B|link|C");
        }

        IReadOnlySet<string> actual = ReferenceReachabilityOracle.EnumeratePathSignatures(
            "A", outgoing, new HashSet<string>(StringComparer.Ordinal) { "A", "B", "C", "D" }, edgeBudget);

        Assert.Equal(expected, actual.Order(StringComparer.Ordinal));
    }
}
