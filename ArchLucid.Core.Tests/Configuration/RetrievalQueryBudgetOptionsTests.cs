using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class RetrievalQueryBudgetOptionsTests
{
    [Fact]
    public void GetEffectiveOverallTimeout_clamps_below_minimum_to_five_seconds()
    {
        RetrievalQueryBudgetOptions options = new() { OverallTimeoutSeconds = 1 };

        options.GetEffectiveOverallTimeout().Should().Be(TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void GetEffectiveOverallTimeout_clamps_above_maximum_to_fifty_five_seconds()
    {
        RetrievalQueryBudgetOptions options = new() { OverallTimeoutSeconds = 120 };

        options.GetEffectiveOverallTimeout().Should().Be(TimeSpan.FromSeconds(55));
    }

    [Fact]
    public void GetEffectiveEmbeddingNetworkTimeout_uses_default_fifteen_seconds()
    {
        RetrievalQueryBudgetOptions options = new();

        options.GetEffectiveEmbeddingNetworkTimeout().Should().Be(TimeSpan.FromSeconds(15));
    }

    [Fact]
    public void GetEffectiveSearchNetworkTimeout_clamps_below_minimum_to_three_seconds()
    {
        RetrievalQueryBudgetOptions options = new() { SearchNetworkTimeoutSeconds = 0 };

        options.GetEffectiveSearchNetworkTimeout().Should().Be(TimeSpan.FromSeconds(3));
    }
}
