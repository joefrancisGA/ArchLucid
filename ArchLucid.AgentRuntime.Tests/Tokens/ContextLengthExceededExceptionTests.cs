using ArchLucid.AgentRuntime.Tokens;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Tokens;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContextLengthExceededExceptionTests
{
    [Fact]
    public void Constructor_sets_token_budget_properties_and_message()
    {
        ContextLengthExceededException exception = new(estimatedTokens: 9000, maxContextTokens: 8192, thresholdTokens: 7500);

        exception.EstimatedTokens.Should().Be(9000);
        exception.MaxContextTokens.Should().Be(8192);
        exception.ThresholdTokens.Should().Be(7500);
        exception.Message.Should().Contain("9000");
        exception.Message.Should().Contain("7500");
        exception.Message.Should().Contain("8192");
    }
}
