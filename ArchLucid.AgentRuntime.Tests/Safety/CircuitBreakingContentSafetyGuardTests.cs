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
    public async Task When_circuit_open_CheckOutputAsync_fail_closed_without_calling_inner()
    {
        CircuitBreakerGate gate = OpenGate();
        Mock<IContentSafetyGuard> inner = new();
        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        ContentSafetyResult result = await sut.CheckOutputAsync("completion", CancellationToken.None);

        result.IsAllowed.Should().BeFalse();
        result.Category.Should().Be("CircuitOpen");
        inner.Verify(
            g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
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
    public async Task When_circuit_open_and_token_cancelled_does_not_scrub_before_throwing()
    {
        CircuitBreakerGate gate = OpenGate();
        Mock<IContentSafetyGuard> inner = new();
        Mock<IPromptRedactor> redactor = new();

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = false },
            redactor.Object);

        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        Func<Task> act = () => sut.CheckInputAsync("hello", cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
        redactor.Verify(r => r.RedactAlways(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task When_circuit_open_and_not_FailClosedOnSdkError_CheckOutputAsync_allows_with_scrub()
    {
        CircuitBreakerGate gate = OpenGate();
        Mock<IContentSafetyGuard> inner = new();
        Mock<IPromptRedactor> redactor = new();
        redactor.Setup(r => r.RedactAlways("{\"completion\":true}"))
            .Returns(new PromptRedactionOutcome("scrubbed-json", new Dictionary<string, int>()));

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = false },
            redactor.Object);

        ContentSafetyResult result =
            await sut.CheckOutputAsync("{\"completion\":true}", CancellationToken.None);

        result.IsAllowed.Should().BeTrue();
        inner.Verify(
            g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        redactor.Verify(r => r.RedactAlways("{\"completion\":true}"), Times.Once);
    }

    [Fact]
    public async Task When_inner_throws_and_fail_open_allows_without_scrub_before_circuit_threshold()
    {
        CircuitBreakerOptions breakerOptions = new() { FailureThreshold = 3, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-inner-throw", breakerOptions);
        Mock<IContentSafetyGuard> inner = new();
        inner.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("simulated inner throw"));

        Mock<IPromptRedactor> redactor = new();
        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = false },
            redactor.Object);

        ContentSafetyResult result = await sut.CheckInputAsync("deny-me", CancellationToken.None);

        result.IsAllowed.Should().BeTrue();
        redactor.Verify(r => r.RedactAlways(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task When_inner_throws_and_fail_closed_blocks_CheckInputAsync_without_scrub()
    {
        CircuitBreakerOptions breakerOptions = new() { FailureThreshold = 3, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-inner-throw-fail-closed", breakerOptions);
        Mock<IContentSafetyGuard> inner = new();
        inner.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("simulated inner throw"));

        Mock<IPromptRedactor> redactor = new();
        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true },
            redactor.Object);

        ContentSafetyResult result = await sut.CheckInputAsync("deny-me", CancellationToken.None);

        result.IsAllowed.Should().BeFalse();
        result.Category.Should().Be("SdkError");
        redactor.Verify(r => r.RedactAlways(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task When_inner_throws_and_fail_closed_blocks_CheckOutputAsync_without_scrub()
    {
        CircuitBreakerOptions breakerOptions = new() { FailureThreshold = 3, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-output-throw-fail-closed", breakerOptions);
        Mock<IContentSafetyGuard> inner = new();
        inner.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("simulated inner output throw"));

        Mock<IPromptRedactor> redactor = new();
        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true },
            redactor.Object);

        ContentSafetyResult result =
            await sut.CheckOutputAsync("{\"completion\":true}", CancellationToken.None);

        result.IsAllowed.Should().BeFalse();
        result.Category.Should().Be("SdkError");
        redactor.Verify(r => r.RedactAlways(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task When_inner_returns_allowed_CheckInputAsync_keeps_circuit_closed()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-allowed-input", options);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult allowed = new(true, null, null, null);
        inner.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(allowed);

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        ContentSafetyResult first = await sut.CheckInputAsync("a", CancellationToken.None);
        first.IsAllowed.Should().BeTrue();

        ContentSafetyResult second = await sut.CheckInputAsync("b", CancellationToken.None);
        second.IsAllowed.Should().BeTrue();
        inner.Verify(
            g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task When_inner_returns_allowed_CheckOutputAsync_keeps_circuit_closed()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-allowed-output", options);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult allowed = new(true, null, null, null);
        inner.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(allowed);

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        ContentSafetyResult first = await sut.CheckOutputAsync("{\"a\":1}", CancellationToken.None);
        first.IsAllowed.Should().BeTrue();

        ContentSafetyResult second = await sut.CheckOutputAsync("{\"b\":2}", CancellationToken.None);
        second.IsAllowed.Should().BeTrue();
        inner.Verify(
            g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task When_inner_returns_SdkError_with_fail_open_option_still_blocks_without_degraded_scrub()
    {
        CircuitBreakerOptions breakerOptions = new() { FailureThreshold = 3, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-sdk-error-fail-open-opt", breakerOptions);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult sdkError = new(false, "Content safety service error.", "SdkError", null);
        inner.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(sdkError);

        Mock<IPromptRedactor> redactor = new();
        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = false },
            redactor.Object);

        ContentSafetyResult result = await sut.CheckInputAsync("hello", CancellationToken.None);

        result.IsAllowed.Should().BeFalse();
        result.Category.Should().Be("SdkError");
        redactor.Verify(r => r.RedactAlways(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task When_inner_returns_SdkError_on_CheckOutputAsync_with_fail_open_option_still_blocks_without_degraded_scrub()
    {
        CircuitBreakerOptions breakerOptions = new() { FailureThreshold = 3, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-output-sdk-error-fail-open-opt", breakerOptions);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult sdkError = new(false, "Content safety service error.", "SdkError", null);
        inner.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(sdkError);

        Mock<IPromptRedactor> redactor = new();
        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = false },
            redactor.Object);

        ContentSafetyResult result =
            await sut.CheckOutputAsync("{\"completion\":true}", CancellationToken.None);

        result.IsAllowed.Should().BeFalse();
        result.Category.Should().Be("SdkError");
        redactor.Verify(r => r.RedactAlways(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task When_inner_throws_operation_canceled_with_unrelated_token_rethrows_without_opening_circuit()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-unrelated-cancel", options);
        Mock<IContentSafetyGuard> inner = new();
        using CancellationTokenSource innerTimeout = new();
        inner.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException("simulated inner timeout", innerTimeout.Token));

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        Func<Task> act = () => sut.CheckInputAsync("a", CancellationToken.None);

        await act.Should().ThrowAsync<OperationCanceledException>();
        gate.CurrentState.Should().Be("Closed");
    }

    [Fact]
    public async Task When_inner_throws_operation_canceled_and_token_cancelled_rethrows_without_opening_circuit()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-cancel", options);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult allowed = new(true, null, null, null);
        inner.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((_, ct) =>
            {
                ct.ThrowIfCancellationRequested();

                return Task.FromResult(allowed);
            });

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        Func<Task> act = () => sut.CheckInputAsync("a", cts.Token);
        await act.Should().ThrowAsync<OperationCanceledException>();

        ContentSafetyResult second = await sut.CheckInputAsync("b", CancellationToken.None);
        second.IsAllowed.Should().BeTrue();
        inner.Verify(
            g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task When_inner_throws_operation_canceled_on_CheckOutputAsync_and_token_cancelled_rethrows_without_opening_circuit()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-output-cancel", options);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult allowed = new(true, null, null, null);
        inner.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((_, ct) =>
            {
                ct.ThrowIfCancellationRequested();

                return Task.FromResult(allowed);
            });

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        Func<Task> act = () => sut.CheckOutputAsync("{\"a\":1}", cts.Token);
        await act.Should().ThrowAsync<OperationCanceledException>();

        ContentSafetyResult second = await sut.CheckOutputAsync("{\"b\":2}", CancellationToken.None);
        second.IsAllowed.Should().BeTrue();
        inner.Verify(
            g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task When_inner_throws_on_CheckOutputAsync_and_fail_open_allows_without_scrub_before_circuit_threshold()
    {
        CircuitBreakerOptions breakerOptions = new() { FailureThreshold = 3, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-output-throw", breakerOptions);
        Mock<IContentSafetyGuard> inner = new();
        inner.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("simulated inner output throw"));

        Mock<IPromptRedactor> redactor = new();
        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = false },
            redactor.Object);

        ContentSafetyResult result =
            await sut.CheckOutputAsync("{\"completion\":true}", CancellationToken.None);

        result.IsAllowed.Should().BeTrue();
        redactor.Verify(r => r.RedactAlways(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task When_inner_returns_content_category_block_records_success_without_opening_circuit()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-category-block", options);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult hateBlock = new(false, "blocked", "Hate", 6);
        inner.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(hateBlock);

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        ContentSafetyResult first = await sut.CheckInputAsync("a", CancellationToken.None);
        first.IsAllowed.Should().BeFalse();
        first.Category.Should().Be("Hate");

        ContentSafetyResult second = await sut.CheckInputAsync("b", CancellationToken.None);
        second.IsAllowed.Should().BeFalse();
        second.Category.Should().Be("Hate");
        inner.Verify(
            g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task When_inner_returns_content_category_block_on_CheckOutputAsync_records_success_without_opening_circuit()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-output-category-block", options);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult hateBlock = new(false, "blocked", "Hate", 6);
        inner.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(hateBlock);

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        ContentSafetyResult first = await sut.CheckOutputAsync("{\"a\":1}", CancellationToken.None);
        first.IsAllowed.Should().BeFalse();
        first.Category.Should().Be("Hate");

        ContentSafetyResult second = await sut.CheckOutputAsync("{\"b\":2}", CancellationToken.None);
        second.IsAllowed.Should().BeFalse();
        second.Category.Should().Be("Hate");
        inner.Verify(
            g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task Consecutive_sdk_failures_on_CheckOutputAsync_open_circuit_then_fail_closed_when_configured()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 1, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-output-sdk", options);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult sdkError = new(false, "Content safety service error.", "SdkError", null);
        inner.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(sdkError);

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        ContentSafetyResult first = await sut.CheckOutputAsync("{\"a\":1}", CancellationToken.None);
        first.IsAllowed.Should().BeFalse();
        first.Category.Should().Be("SdkError");

        ContentSafetyResult second = await sut.CheckOutputAsync("{\"b\":2}", CancellationToken.None);
        second.IsAllowed.Should().BeFalse();
        second.Category.Should().Be("CircuitOpen");
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

    [Fact]
    public async Task When_single_SdkError_with_failure_threshold_two_keeps_circuit_closed_for_next_call()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 2, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-sdk-threshold-two", options);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult sdkError = new(false, "Content safety service error.", "SdkError", null);
        ContentSafetyResult allowed = new(true, null, null, null);
        inner.SetupSequence(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(sdkError)
            .ReturnsAsync(allowed);

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        ContentSafetyResult first = await sut.CheckInputAsync("a", CancellationToken.None);
        first.IsAllowed.Should().BeFalse();
        first.Category.Should().Be("SdkError");

        ContentSafetyResult second = await sut.CheckInputAsync("b", CancellationToken.None);
        second.IsAllowed.Should().BeTrue();
        inner.Verify(
            g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task When_single_SdkError_on_CheckOutputAsync_with_failure_threshold_two_keeps_circuit_closed_for_next_call()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 2, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-output-sdk-threshold-two", options);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult sdkError = new(false, "Content safety service error.", "SdkError", null);
        ContentSafetyResult allowed = new(true, null, null, null);
        inner.SetupSequence(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(sdkError)
            .ReturnsAsync(allowed);

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        ContentSafetyResult first = await sut.CheckOutputAsync("{\"a\":1}", CancellationToken.None);
        first.IsAllowed.Should().BeFalse();
        first.Category.Should().Be("SdkError");

        ContentSafetyResult second = await sut.CheckOutputAsync("{\"b\":2}", CancellationToken.None);
        second.IsAllowed.Should().BeTrue();
        inner.Verify(
            g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task When_single_inner_throw_with_failure_threshold_two_keeps_circuit_closed_for_next_call()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 2, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-throw-threshold-two", options);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult allowed = new(true, null, null, null);
        int callCount = 0;
        inner.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((_, _) =>
            {
                callCount++;

                if (callCount == 1)
                    throw new InvalidOperationException("simulated inner throw");

                return Task.FromResult(allowed);
            });

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        ContentSafetyResult first = await sut.CheckInputAsync("a", CancellationToken.None);
        first.IsAllowed.Should().BeFalse();
        first.Category.Should().Be("SdkError");

        ContentSafetyResult second = await sut.CheckInputAsync("b", CancellationToken.None);
        second.IsAllowed.Should().BeTrue();
        inner.Verify(
            g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task When_single_inner_throw_on_CheckOutputAsync_with_failure_threshold_two_keeps_circuit_closed_for_next_call()
    {
        CircuitBreakerOptions options = new() { FailureThreshold = 2, DurationOfBreakSeconds = 60 };
        CircuitBreakerGate gate = new("content-safety-output-throw-threshold-two", options);
        Mock<IContentSafetyGuard> inner = new();
        ContentSafetyResult allowed = new(true, null, null, null);
        int callCount = 0;
        inner.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((_, _) =>
            {
                callCount++;

                if (callCount == 1)
                    throw new InvalidOperationException("simulated inner output throw");

                return Task.FromResult(allowed);
            });

        CircuitBreakingContentSafetyGuard sut = CreateSut(
            inner.Object,
            gate,
            new ContentSafetyOptions { FailClosedOnSdkError = true });

        ContentSafetyResult first = await sut.CheckOutputAsync("{\"a\":1}", CancellationToken.None);
        first.IsAllowed.Should().BeFalse();
        first.Category.Should().Be("SdkError");

        ContentSafetyResult second = await sut.CheckOutputAsync("{\"b\":2}", CancellationToken.None);
        second.IsAllowed.Should().BeTrue();
        inner.Verify(
            g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
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
