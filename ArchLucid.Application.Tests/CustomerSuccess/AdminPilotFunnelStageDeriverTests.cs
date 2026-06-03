using ArchLucid.Application.CustomerSuccess;

using FluentAssertions;

namespace ArchLucid.Application.Tests.CustomerSuccess;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AdminPilotFunnelStageDeriverTests
{
    [Theory]
    [InlineData(0, 0, 0, "Not started")]
    [InlineData(2, 0, 0, "In progress")]
    [InlineData(3, 2, 0, "Committed")]
    [InlineData(3, 2, 1, "Habit forming")]
    public void Derive_returns_expected_stage(int totalRuns, int committedRuns, int comparisons, string expected)
    {
        string stage = AdminPilotFunnelStageDeriver.Derive(totalRuns, committedRuns, comparisons);

        stage.Should().Be(expected);
    }
}
