using ArchLucid.AgentRuntime.Safety;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContentSafetyEnabledButUnconfiguredGuardTests
{
    [Fact]
    public async Task CheckInputAsync_throws_invalid_operation()
    {
        ContentSafetyEnabledButUnconfiguredGuard sut = new();

        Func<Task> act = () => sut.CheckInputAsync("input", CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*ContentSafety:Enabled is true*");
    }

    [Fact]
    public async Task CheckOutputAsync_throws_invalid_operation()
    {
        ContentSafetyEnabledButUnconfiguredGuard sut = new();

        Func<Task> act = () => sut.CheckOutputAsync("output", CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*ContentSafety:Enabled is true*");
    }
}
