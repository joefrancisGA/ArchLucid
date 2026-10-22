using ArchLucid.AgentRuntime.Tokens;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CharHeuristicTokenCounterTests
{
    [Fact]
    public void CountTokens_returns_zero_for_null_or_empty()
    {
        CharHeuristicTokenCounter sut = new();

        sut.CountTokens(null!).Should().Be(0);
        sut.CountTokens(string.Empty).Should().Be(0);
    }

    [Fact]
    public void CountTokens_estimates_positive_count_for_non_empty_text()
    {
        CharHeuristicTokenCounter sut = new();

        sut.CountTokens("architecture review grounding summary").Should().BeGreaterThan(0);
    }
}
