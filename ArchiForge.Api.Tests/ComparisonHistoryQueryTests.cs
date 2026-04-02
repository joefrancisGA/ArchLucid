using ArchiForge.Api.Models;

using FluentAssertions;

namespace ArchiForge.Api.Tests;

public sealed class ComparisonHistoryQueryTests
{
    [Fact]
    public void NormalizeTagList_merges_tag_and_tags_distinct_case_insensitive()
    {
        List<string> list = ComparisonHistoryQuery.NormalizeTagList("a,B", ["b", "c"]);

        list.Should().HaveCount(3);
        list.Should().Contain(x => string.Equals(x, "a", StringComparison.OrdinalIgnoreCase));
        list.Should().Contain(x => string.Equals(x, "b", StringComparison.OrdinalIgnoreCase));
        list.Should().Contain(x => string.Equals(x, "c", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void NormalizeTagList_splits_commas_in_tag_and_array()
    {
        List<string> list = ComparisonHistoryQuery.NormalizeTagList("x,y", ["y,z"]);

        list.Should().BeEquivalentTo(["x", "y", "z"], opts => opts.WithoutStrictOrdering());
    }
}
