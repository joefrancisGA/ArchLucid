using ArchLucid.Application.SecureNow;
using FluentAssertions;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
public sealed class SecureNowTopologyCardinalityForecastTests
{
    [Fact]
    public void Chain_counts_actual_prefixes()
    {
        IReadOnlyDictionary<string, IReadOnlyList<string>> graph = new Dictionary<string, IReadOnlyList<string>>
        {
            ["a"] = ["b"], ["b"] = ["c"], ["c"] = []
        };
        var result = SecureNowTopologyCardinalityForecast.Count(graph, ["a"], 3);
        result.PrefixCount.Should().Be(3);
        result.Truncated.Should().BeFalse();
    }

    [Fact]
    public void Cycles_do_not_repeat_nodes_in_one_path()
    {
        IReadOnlyDictionary<string, IReadOnlyList<string>> graph = new Dictionary<string, IReadOnlyList<string>>
        {
            ["a"] = ["b"], ["b"] = ["a"]
        };
        SecureNowTopologyCardinalityForecast.Count(graph, ["a"], 5).PrefixCount.Should().Be(2);
    }

    [Fact]
    public void Dense_branching_is_explicitly_truncated()
    {
        IReadOnlyDictionary<string, IReadOnlyList<string>> graph = new Dictionary<string, IReadOnlyList<string>>
        {
            ["a"] = ["b", "c", "d"], ["b"] = ["c", "d"], ["c"] = ["b", "d"],
            ["d"] = ["b", "c"]
        };
        var result = SecureNowTopologyCardinalityForecast.Count(graph, ["a"], 3, 3);
        result.PrefixCount.Should().Be(3);
        result.Truncated.Should().BeTrue();
    }

    [Fact]
    public void Empty_graph_has_no_prefixes()
    {
        SecureNowTopologyCardinalityForecast.Count(
            new Dictionary<string, IReadOnlyList<string>>(), [], 4).PrefixCount.Should().Be(0);
    }
}
