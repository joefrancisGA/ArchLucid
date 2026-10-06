using ArchLucid.AgentRuntime.Safety;
using ArchLucid.Core.Safety;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class NullContentSafetyGuardTests
{
    [SkippableFact]
    public async Task CheckInputAsync_returns_allowed_without_categories()
    {
        NullContentSafetyGuard sut = new();

        ContentSafetyResult result = await sut.CheckInputAsync("any text", CancellationToken.None);

        result.IsAllowed.Should().BeTrue();
        result.Category.Should().BeNull();
    }

    [SkippableFact]
    public async Task CheckOutputAsync_returns_allowed_without_categories()
    {
        NullContentSafetyGuard sut = new();

        ContentSafetyResult result = await sut.CheckOutputAsync("any text", CancellationToken.None);

        result.IsAllowed.Should().BeTrue();
        result.Category.Should().BeNull();
    }

    [SkippableFact]
    public async Task CheckInputAsync_when_token_cancelled_throws_operation_canceled_even_for_whitespace()
    {
        NullContentSafetyGuard sut = new();

        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        Func<Task> act = () => sut.CheckInputAsync("   ", cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }
}
