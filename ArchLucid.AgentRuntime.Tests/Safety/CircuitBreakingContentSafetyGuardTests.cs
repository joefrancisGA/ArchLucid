using ArchLucid.AgentRuntime.Safety;
using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Safety;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Safety;

[Trait("Category", "Unit")]
public sealed class CircuitBreakingContentSafetyGuardTests
{
    [Fact]
    public async Task When_circuit_open_and_FailClosedOnSdkError_blocks_without_calling_inner()
    {
        CircuitBreakerGate gate = OpenGate();
        Mock<IContentSafetyGuard> inner = new();
        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        ContentSafetyResult result = await sut.CheckInputAsync("hello", CancellationToken.None);

        result.IsAllowed.Should().BeFalse();
        result.Category.Should().Be("CircuitOpen");
        inner.Verify(
            g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task When_circuit_open_and_not_FailClosedOnSdkError_allows_with_scrub()
    {
        CircuitBreakerGate gate = OpenGate();
        Mock<IContentSafetyGuard> inner = new();
        Mock<IPromptRedactor> redactor = new();
        redactor.Setup(r => r.RedactAlways("hello"))
            .Returns(new PromptRedactionOutcome("scrubbed", new Dictionary<string, int> { ["secret"] = 1 }));

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = false },
            redactor.Object);

        ContentSafetyResult result = await sut.CheckInputAsync("hello", CancellationToken.None);

        result.IsAllowed.Should().BeTrue();
        inner.Verify(
            g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        redactor.Verify(r => r.RedactAlways("hello"), Times.Once);
    }

    [Fact]
    public async Task Consecutive_sdk_failures_open_circuit_then_fail_closed_when_configured()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-test", options);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult sdkError = new(false, "Content safety service error.", "SdkError", null);
        inner.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(sdkError);

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        ContentSafetyResult first = await sut.CheckInputAsync("a", CancellationToken.None);
        first.IsAllowed.Should().BeFalse();
        first.Category.Should().Be("SdkError");

        ContentSafetyResult second = await sut.CheckInputAsync("b", CancellationToken.None);
        second.IsAllowed.Should().BeFalse();
        second.Category.Should().Be("CircuitOpen");
    }

    private static CircuitBreakerGate OpenGate()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("open-gate", options);
        gate.RecordFailure();

        return gate;
    }

    private static CircuitBreakingContentSafetyGuard CreateSut(
        IContentSafetyGuard inner,
        CircuitBreakerGate gate,
        ContentSafetyOptions contentSafetyOptions,
        IPromptRedactor? promptRedactor = null)
    {
        Mock<IPromptRedactor> redactorMock = new();
        redactorMock.Setup(r => r.RedactAlways(It.IsAny<string>()))
            .Returns((string? s) => new PromptRedactionOutcome(s ?? string.Empty, new Dictionary<string, int>()));

        ServiceCollection services = new();
        services.AddLogging();
        ServiceProvider provider = services.BuildServiceProvider();

        return new CircuitBreakingContentSafetyGuard(
            inner,
            gate,
            promptRedactor ?? redactorMock.Object,
            new FixedValueOptionsMonitor<ContentSafetyOptions>(contentSafetyOptions),
            provider.GetRequiredService<IServiceScopeFactory>(),
            provider.GetRequiredService<ILogger<CircuitBreakingContentSafetyGuard>>());
    }
}
