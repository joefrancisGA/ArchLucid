using System.ClientModel;
using System.ClientModel.Primitives;
using System.Net;

using ArchLucid.Core.Resilience;

using Azure;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Polly;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>
///     Polly retry inside <see cref="CircuitBreakingAgentCompletionClient" />, then
///     <see cref="FallbackAgentCompletionClient" /> — mirrors host composition for
///     <c>ArchLucid:FallbackLlm</c>.
/// </summary>
[Trait("Category", "Unit")]
public sealed class FallbackLlmResilienceCompositionTests
{
    private static readonly LlmProviderDescriptor PrimaryDescriptor =
        LlmProviderDescriptor.ForAzureOpenAi(new Uri("https://primary.example"), "primary");

    [SkippableFact]
    public async Task Retry_exhausts_on_primary_Http_429_then_fallback_succeeds_counts_primary_inner_per_attempt()
    {
        int primaryInnerCalls = 0;
        Mock<IAgentCompletionClient> primaryInner = new();
        primaryInner.SetupGet(c => c.Descriptor).Returns(PrimaryDescriptor);
        primaryInner
            .Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                int n = Interlocked.Increment(ref primaryInnerCalls);

                return Task.FromException<string>(
                    new HttpRequestException($"limit-{n}", null, HttpStatusCode.TooManyRequests));
            });

        Mock<IAgentCompletionClient> secondary = new();
        secondary
            .SetupGet(c => c.Descriptor)
            .Returns(LlmProviderDescriptor.ForAzureOpenAi(new Uri("https://secondary.example"), "secondary"));
        secondary.Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>()))
            .ReturnsAsync("{\"from\":\"fallback\"}");

        using CircuitBreakingAgentCompletionClient primaryChain = CreatePrimaryWithRetry(primaryInner.Object, maxRetryAttempts: 3);

        FallbackAgentCompletionClient sut = new(
            primaryChain,
            secondary.Object,
            NullLogger<FallbackAgentCompletionClient>.Instance);

        string result = await sut.CompleteJsonAsync("s", "u");

        result.Should().Be("{\"from\":\"fallback\"}");
        primaryInnerCalls.Should().Be(4);

        secondary.Verify(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>()), Times.Once);
    }

    [SkippableFact]
    public async Task Retry_exhausts_on_primary_Http_504_gateway_timeout_then_fallback_succeeds()
    {
        int primaryInnerCalls = 0;
        Mock<IAgentCompletionClient> primaryInner = new();
        primaryInner.SetupGet(c => c.Descriptor).Returns(PrimaryDescriptor);
        primaryInner
            .Setup(c => c.CompleteJsonAsync("a", "b", It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                Interlocked.Increment(ref primaryInnerCalls);

                return Task.FromException<string>(
                    new HttpRequestException("gateway", null, HttpStatusCode.GatewayTimeout));
            });

        Mock<IAgentCompletionClient> secondary = new();
        secondary.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("fb", "fb"));
        secondary.Setup(c => c.CompleteJsonAsync("a", "b", It.IsAny<CancellationToken>()))
            .ReturnsAsync("{}");

        using CircuitBreakingAgentCompletionClient primaryChain = CreatePrimaryWithRetry(primaryInner.Object, maxRetryAttempts: 2);

        FallbackAgentCompletionClient sut = new(
            primaryChain,
            secondary.Object,
            NullLogger<FallbackAgentCompletionClient>.Instance);

        string result = await sut.CompleteJsonAsync("a", "b");

        result.Should().Be("{}");
        primaryInnerCalls.Should().Be(3);
        secondary.Verify(c => c.CompleteJsonAsync("a", "b", It.IsAny<CancellationToken>()), Times.Once);
    }

    [SkippableFact]
    public async Task Retry_exhausts_on_primary_ClientResultException_429_then_fallback_succeeds()
    {
        int primaryInnerCalls = 0;
        Mock<IAgentCompletionClient> primaryInner = new();
        primaryInner.SetupGet(c => c.Descriptor).Returns(PrimaryDescriptor);
        primaryInner
            .Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                Interlocked.Increment(ref primaryInnerCalls);

                return Task.FromException<string>(CreateClientResultException(429));
            });

        Mock<IAgentCompletionClient> secondary = new();
        secondary.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("fb", "fb"));
        secondary.Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>()))
            .ReturnsAsync("ok");

        using CircuitBreakingAgentCompletionClient primaryChain = CreatePrimaryWithRetry(primaryInner.Object, maxRetryAttempts: 1);

        FallbackAgentCompletionClient sut = new(
            primaryChain,
            secondary.Object,
            NullLogger<FallbackAgentCompletionClient>.Instance);

        string result = await sut.CompleteJsonAsync("s", "u");

        result.Should().Be("ok");
        primaryInnerCalls.Should().Be(1);

        secondary.Verify(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>()), Times.Once);
    }

    [SkippableFact]
    public async Task DelegatingLlmCompletionProvider_over_chain_matches_fallback_after_exhausted_retries()
    {
        int primaryInnerCalls = 0;
        Mock<IAgentCompletionClient> primaryInner = new();
        primaryInner.SetupGet(c => c.Descriptor).Returns(PrimaryDescriptor);
        primaryInner
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                Interlocked.Increment(ref primaryInnerCalls);

                return Task.FromException<string>(
                    new HttpRequestException("limit", null, HttpStatusCode.TooManyRequests));
            });

        Mock<IAgentCompletionClient> secondary = new();
        secondary.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("sec", "sec"));
        secondary
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("{}");

        using CircuitBreakingAgentCompletionClient primaryChain = CreatePrimaryWithRetry(primaryInner.Object, maxRetryAttempts: 2);

        using FallbackAgentCompletionClient fallback = new(
            primaryChain,
            secondary.Object,
            NullLogger<FallbackAgentCompletionClient>.Instance);

        ILlmCompletionProvider sut = new DelegatingLlmCompletionProvider(fallback, "azure-openai", "dep-a");

        string result = await sut.CompleteJsonAsync("x", "y");

        result.Should().Be("{}");
        primaryInnerCalls.Should().Be(3);

        sut.ProviderId.Should().Be("azure-openai");
        sut.ModelDeploymentLabel.Should().Be("dep-a");
    }

    [SkippableFact]
    public async Task TaskCanceledException_without_user_cancellation_is_not_fallback_eligible_even_after_retries()
    {
        int primaryInnerCalls = 0;
        Mock<IAgentCompletionClient> primaryInner = new();
        primaryInner.SetupGet(c => c.Descriptor).Returns(PrimaryDescriptor);
        primaryInner
            .Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                Interlocked.Increment(ref primaryInnerCalls);

                return Task.FromException<string>(
                    new TaskCanceledException("timeout", null, CancellationToken.None));
            });

        Mock<IAgentCompletionClient> secondary = new();
        secondary.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("fb", "fb"));

        using CircuitBreakingAgentCompletionClient primaryChain = CreatePrimaryWithRetry(primaryInner.Object, maxRetryAttempts: 2);

        FallbackAgentCompletionClient sut = new(
            primaryChain,
            secondary.Object,
            NullLogger<FallbackAgentCompletionClient>.Instance);

        Func<Task> act = async () => await sut.CompleteJsonAsync("s", "u");

        await act.Should().ThrowAsync<TaskCanceledException>();

        primaryInnerCalls.Should().Be(3);

        secondary.Verify(
            c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task Primary_RequestFailedException_503_then_fallback_succeeds()
    {
        Mock<IAgentCompletionClient> primaryInner = new();
        primaryInner.SetupGet(c => c.Descriptor).Returns(PrimaryDescriptor);
        primaryInner
            .Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>()))
            .Returns(Task.FromException<string>(new RequestFailedException(503, "Service unavailable", null, null)));

        Mock<IAgentCompletionClient> secondary = new();
        secondary.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("fb", "fb"));
        secondary.Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>())).ReturnsAsync("ok");

        using CircuitBreakingAgentCompletionClient primaryChain = CreatePrimaryWithRetry(primaryInner.Object, maxRetryAttempts: 0);

        using FallbackAgentCompletionClient sut = new(
            primaryChain,
            secondary.Object,
            NullLogger<FallbackAgentCompletionClient>.Instance);

        string result = await sut.CompleteJsonAsync("s", "u");

        result.Should().Be("ok");
    }

    [SkippableFact]
    public async Task Ordered_fallbacks_prior_entries_may_fail_before_later_succeeds()
    {
        Mock<IAgentCompletionClient> primaryInner = new();
        primaryInner.SetupGet(c => c.Descriptor).Returns(PrimaryDescriptor);
        primaryInner
            .Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>()))
            .Returns(Task.FromException<string>(new RequestFailedException(503, "primary", null, null)));

        Mock<IAgentCompletionClient> fb0 = new();
        fb0.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("a", "a"));
        fb0.Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>()))
            .Returns(Task.FromException<string>(new RequestFailedException(503, "fb0", null, null)));

        Mock<IAgentCompletionClient> fb1 = new();
        fb1.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("b", "b"));
        fb1.Setup(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>())).ReturnsAsync("final");

        using CircuitBreakingAgentCompletionClient primaryChain = CreatePrimaryWithRetry(primaryInner.Object, maxRetryAttempts: 0);

        using FallbackAgentCompletionClient sut = new(
            primaryChain,
            new[] { fb0.Object, fb1.Object },
            NullLogger<FallbackAgentCompletionClient>.Instance);

        string result = await sut.CompleteJsonAsync("s", "u");

        result.Should().Be("final");

        fb0.Verify(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>()), Times.Once);
        fb1.Verify(c => c.CompleteJsonAsync("s", "u", It.IsAny<CancellationToken>()), Times.Once);
    }

    private static CircuitBreakingAgentCompletionClient CreatePrimaryWithRetry(
        IAgentCompletionClient inner,
        int maxRetryAttempts,
        int failureThreshold = 10)
    {
        CircuitBreakerOptions options = new()
        {
            FailureThreshold = failureThreshold,
            DurationOfBreakSeconds = 60
        };
        CircuitBreakerGate gate = new("composition-primary-gate", options);
        ResiliencePipeline retry = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            logger: NullLogger.Instance,
            maxRetryAttempts: maxRetryAttempts,
            baseDelay: TimeSpan.FromMilliseconds(1),
            maxDelay: TimeSpan.FromMilliseconds(50));

        return new CircuitBreakingAgentCompletionClient(
            inner,
            gate,
            retry,
            NullLogger<CircuitBreakingAgentCompletionClient>.Instance);
    }

    private static ClientResultException CreateClientResultException(int status)
    {
        Mock<PipelineResponse> response = new();
        response.SetupGet(r => r.Status).Returns(status);

        return new ClientResultException("test", response.Object);
    }
}
