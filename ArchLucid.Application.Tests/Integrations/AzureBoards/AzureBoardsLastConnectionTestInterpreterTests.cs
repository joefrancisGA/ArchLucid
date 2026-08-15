using ArchLucid.Application.Integrations.AzureBoards;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.AzureBoards;

[Trait("Category", "Unit")]
public sealed class AzureBoardsLastConnectionTestInterpreterTests
{
    [Fact]
    public void TryInterpret_returns_null_when_no_last_test_exists()
    {
        AzureBoardsLastConnectionTestInterpreter.TryInterpret(null, null).Should().BeNull();
        AzureBoardsLastConnectionTestInterpreter.TryInterpret(null, "   ").Should().BeNull();
    }

    [Theory]
    [InlineData("Azure Boards reachable (2 project(s) discovered).")]
    [InlineData("Connection check succeeded.")]
    public void TryInterpret_returns_true_for_success_summaries(string summary)
    {
        AzureBoardsLastConnectionTestInterpreter.TryInterpret(DateTime.UtcNow, summary).Should().BeTrue();
        AzureBoardsLastConnectionTestInterpreter.IsSuccessSummary(summary).Should().BeTrue();
    }

    [Fact]
    public void TryInterpret_returns_false_for_failed_summaries()
    {
        AzureBoardsLastConnectionTestInterpreter
            .TryInterpret(DateTime.UtcNow, "Azure Boards connection test failed.")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsSuccessSummary_returns_false_for_blank()
    {
        AzureBoardsLastConnectionTestInterpreter.IsSuccessSummary(null).Should().BeFalse();
        AzureBoardsLastConnectionTestInterpreter.IsSuccessSummary("  ").Should().BeFalse();
    }
}
