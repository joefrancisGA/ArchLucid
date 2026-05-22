using ArchLucid.Retrieval.Chunking;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TokenAwareContextBudgetTests
{
    [SkippableFact]
    public void TruncateToTokenBudget_returns_original_when_within_budget()
    {
        string text = new('a', 400);

        string result = TokenAwareContextBudget.TruncateToTokenBudget(text, maxEstimatedTokens: 200, out bool truncated);

        truncated.Should().BeFalse();
        result.Should().Be(text);
    }

    [SkippableFact]
    public void TruncateToTokenBudget_truncates_oversized_payload_with_suffix()
    {
        string text = new('x', 500_000);

        string result = TokenAwareContextBudget.TruncateToTokenBudget(
            text,
            maxEstimatedTokens: 100,
            charsPerToken: 4,
            out bool truncated);

        truncated.Should().BeTrue();
        result.Length.Should().BeLessThan(text.Length);
        result.Should().Contain("[Context truncated:");
    }

    [SkippableTheory]
    [InlineData("", 0)]
    [InlineData("abcd", 1)]
    [InlineData("abcdefgh", 2)]
    public void EstimateTokenCount_uses_chars_per_token_heuristic(string text, int expected)
    {
        TokenAwareContextBudget.EstimateTokenCount(text, charsPerToken: 4).Should().Be(expected);
    }
}
