using System.Net;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FallbackCancellationBoundaryTests
{
    [Fact]
    public async Task Primary_throttle_after_cancellation_does_not_start_secondary()
    {
        using CancellationTokenSource caller = new();
        Mock<IAgentCompletionClient> primary = new();
        Mock<IAgentCompletionClient> secondary = new();
        primary.SetupGet(x => x.Descriptor).Returns(LlmProviderDescriptor.ForOffline("primary", "test"));
        primary.Setup(x => x.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                caller.Cancel();
                return Task.FromException<string>(
                    new HttpRequestException("late throttle", null, HttpStatusCode.TooManyRequests));
            });
        FallbackAgentCompletionClient sut = new(
            primary.Object, secondary.Object, NullLogger<FallbackAgentCompletionClient>.Instance);

        Func<Task> invoke = () => sut.CompleteJsonAsync("s", "u", cancellationToken: caller.Token);

        await invoke.Should().ThrowAsync<OperationCanceledException>();
        secondary.Verify(x => x.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task First_fallback_failure_after_cancellation_does_not_start_next_fallback()
    {
        using CancellationTokenSource caller = new();
        Mock<IAgentCompletionClient> primary = new();
        Mock<IAgentCompletionClient> first = new();
        Mock<IAgentCompletionClient> second = new();
        primary.SetupGet(x => x.Descriptor).Returns(LlmProviderDescriptor.ForOffline("primary", "test"));
        primary.Setup(x => x.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("throttled", null, HttpStatusCode.TooManyRequests));
        first.Setup(x => x.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                caller.Cancel();
                return Task.FromException<string>(
                    new HttpRequestException("fallback down", null, HttpStatusCode.ServiceUnavailable));
            });

        FallbackAgentCompletionClient sut = new(
            primary.Object, [first.Object, second.Object],
            NullLogger<FallbackAgentCompletionClient>.Instance);

        Func<Task> invoke = () => sut.CompleteJsonAsync("s", "u", cancellationToken: caller.Token);

        await invoke.Should().ThrowAsync<OperationCanceledException>();
        first.Verify(x => x.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Once);
        second.Verify(x => x.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Late_primary_success_after_cancellation_is_not_returned()
    {
        using CancellationTokenSource caller = new();
        Mock<IAgentCompletionClient> primary = new();
        Mock<IAgentCompletionClient> secondary = new();
        primary.SetupGet(x => x.Descriptor).Returns(LlmProviderDescriptor.ForOffline("primary", "test"));
        primary.Setup(x => x.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                caller.Cancel();
                return Task.FromResult("{\"late\":true}");
            });
        FallbackAgentCompletionClient sut = new(
            primary.Object, secondary.Object, NullLogger<FallbackAgentCompletionClient>.Instance);

        Func<Task> invoke = () => sut.CompleteJsonAsync("s", "u", cancellationToken: caller.Token);
        await invoke.Should().ThrowAsync<OperationCanceledException>();
        secondary.Verify(x => x.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Streaming_primary_failure_after_cancellation_does_not_start_fallback()
    {
        using CancellationTokenSource caller = new();
        Mock<IAgentStreamingCompletionClient> primary = new();
        Mock<IAgentStreamingCompletionClient> secondary = new();
        primary.SetupGet(x => x.Descriptor).Returns(LlmProviderDescriptor.ForOffline("primary", "test"));
        primary.Setup(x => x.StreamJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() => StreamThenCancelAndFail(caller));
        FallbackAgentCompletionClient sut = new(
            primary.Object, secondary.Object, NullLogger<FallbackAgentCompletionClient>.Instance);

        Func<Task> invoke = async () =>
        {
            await foreach (string _ in sut.StreamJsonAsync("s", "u", cancellationToken: caller.Token))
            {
            }
        };

        await invoke.Should().ThrowAsync<OperationCanceledException>();
        secondary.Verify(x => x.StreamJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Never);
        secondary.Verify(x => x.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private static async IAsyncEnumerable<string> StreamThenCancelAndFail(CancellationTokenSource caller)
    {
        yield return "initial";
        await Task.Yield();
        caller.Cancel();
        throw new HttpRequestException("late throttle", null, HttpStatusCode.TooManyRequests);
    }
}
