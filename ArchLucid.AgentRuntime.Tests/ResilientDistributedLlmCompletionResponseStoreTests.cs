using ArchLucid.AgentRuntime;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Polly;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class ResilientDistributedLlmCompletionResponseStoreTests
{
    [Fact]
    public async Task TryGetAsync_CallerCancellation_IsNotConvertedToMemoryFallback()
    {
        Mock<ILlmCompletionResponseStore> distributed = new();
        distributed.Setup(s => s.TryGetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException("cancelled"));
        using MemoryLlmCompletionResponseStore fallback = new(maxEntries: 8);
        await fallback.SetAsync("key-cancel", "stale", TimeSpan.FromMinutes(5), CancellationToken.None);
        using ResilientDistributedLlmCompletionResponseStore sut = new(
            distributed.Object, fallback,
            LlmCompletionDistributedStoreResilienceDefaults.BuildCircuitBreakerPipeline(
                NullLogger.Instance, failureThreshold: 2),
            NullLogger<ResilientDistributedLlmCompletionResponseStore>.Instance);
        using CancellationTokenSource cancellation = new();
        cancellation.Cancel();
        Func<Task> act = async () => await sut.TryGetAsync("key-cancel", cancellation.Token);
        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task SetAsync_CallerCancellation_DoesNotWriteFallback()
    {
        Mock<ILlmCompletionResponseStore> distributed = new();
        distributed.Setup(s => s.SetAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException("cancelled"));
        using MemoryLlmCompletionResponseStore fallback = new(maxEntries: 8);
        using ResilientDistributedLlmCompletionResponseStore sut = new(
            distributed.Object, fallback,
            LlmCompletionDistributedStoreResilienceDefaults.BuildCircuitBreakerPipeline(
                NullLogger.Instance, failureThreshold: 2),
            NullLogger<ResilientDistributedLlmCompletionResponseStore>.Instance);
        using CancellationTokenSource cancellation = new();
        cancellation.Cancel();
        Func<Task> act = () => sut.SetAsync("key-cancel", "value",
            TimeSpan.FromMinutes(5), cancellation.Token);
        await act.Should().ThrowAsync<OperationCanceledException>();
        (await fallback.TryGetAsync("key-cancel", CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task MemoryFallback_RejectsCanceledReadAndWrite()
    {
        using MemoryLlmCompletionResponseStore store = new(maxEntries: 8);
        using CancellationTokenSource cancellation = new();
        cancellation.Cancel();

        Func<Task> write = () => store.SetAsync(
            "cancelled-key", "body", TimeSpan.FromMinutes(1), cancellation.Token);
        await write.Should().ThrowAsync<OperationCanceledException>();

        Func<Task> read = async () => await store.TryGetAsync(
            "cancelled-key", cancellation.Token);
        await read.Should().ThrowAsync<OperationCanceledException>();
        (await store.TryGetAsync("cancelled-key", CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task TryGetAsync_WhenDistributedFails_FallsBackToMemory()
    {
        Mock<ILlmCompletionResponseStore> distributed = new();
        distributed
            .Setup(static s => s.TryGetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("redis unavailable"));

        ResiliencePipeline pipeline = LlmCompletionDistributedStoreResilienceDefaults.BuildCircuitBreakerPipeline(
            NullLogger.Instance,
            failureThreshold: 2,
            breakDurationSeconds: 30);

        using MemoryLlmCompletionResponseStore fallback = new(maxEntries: 8);
        await fallback.SetAsync("key-1", "cached-body", TimeSpan.FromMinutes(5), CancellationToken.None);

        using ResilientDistributedLlmCompletionResponseStore sut = new(
            distributed.Object,
            fallback,
            pipeline,
            NullLogger<ResilientDistributedLlmCompletionResponseStore>.Instance);

        string? result = await sut.TryGetAsync("key-1", CancellationToken.None);

        result.Should().Be("cached-body");
    }

    [Fact]
    public async Task SetAsync_WhenDistributedFails_PersistsToMemoryFallback()
    {
        Mock<ILlmCompletionResponseStore> distributed = new();
        distributed
            .Setup(static s => s.SetAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("redis unavailable"));

        ResiliencePipeline pipeline = LlmCompletionDistributedStoreResilienceDefaults.BuildCircuitBreakerPipeline(
            NullLogger.Instance,
            failureThreshold: 2,
            breakDurationSeconds: 30);

        using MemoryLlmCompletionResponseStore fallback = new(maxEntries: 8);

        using ResilientDistributedLlmCompletionResponseStore sut = new(
            distributed.Object,
            fallback,
            pipeline,
            NullLogger<ResilientDistributedLlmCompletionResponseStore>.Instance);

        await sut.SetAsync("key-2", "stored-body", TimeSpan.FromMinutes(5), CancellationToken.None);

        string? result = await fallback.TryGetAsync("key-2", CancellationToken.None);

        result.Should().Be("stored-body");
        distributed.Verify(
            static s => s.SetAsync("key-2", "stored-body", It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
