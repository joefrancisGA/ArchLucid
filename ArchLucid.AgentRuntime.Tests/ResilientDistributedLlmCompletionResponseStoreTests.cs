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
