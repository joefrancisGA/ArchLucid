using ArchLucid.Application.Runs;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class NoScheduledAgentTasksExceptionTests
{
    [Fact]
    public void Constructor_sets_run_id_and_stable_message()
    {
        NoScheduledAgentTasksException ex = new("run-abc");

        ex.RunId.Should().Be("run-abc");
        ex.Message.Should().Be("No tasks found for run 'run-abc'.");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_rejects_missing_run_id(string? runId)
    {
        Action act = () => _ = new NoScheduledAgentTasksException(runId!);

        act.Should().Throw<ArgumentException>();
    }
}
