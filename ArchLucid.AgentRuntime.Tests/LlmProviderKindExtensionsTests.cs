using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LlmProviderKindExtensionsTests
{
    [Fact]
    public void IsExcludedFromBudgetTracking_returns_false_for_null_whitespace_or_unknown_kind()
    {
        ((string?)null).IsExcludedFromBudgetTracking().Should().BeFalse();
        "".IsExcludedFromBudgetTracking().Should().BeFalse();
        "   ".IsExcludedFromBudgetTracking().Should().BeFalse();
        "azure-openai".IsExcludedFromBudgetTracking().Should().BeFalse();
    }

    [Theory]
    [InlineData("simulator")]
    [InlineData("Simulator")]
    [InlineData("fake")]
    [InlineData("FAKE")]
    [InlineData("echo")]
    [InlineData("ECHO")]
    public void IsExcludedFromBudgetTracking_returns_true_for_excluded_kinds_case_insensitive(string kind)
    {
        kind.IsExcludedFromBudgetTracking().Should().BeTrue();
    }
}
