using System.Net;
using System.Text.Json;

using ArchLucid.AgentRuntime;
using ArchLucid.Core.Resilience;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class LlmCompletionFailureClassifierTests
{
    [Fact]
    public void Classify_empty_assistant_invalid_operation_is_semantic_terminal()
    {
        LlmCompletionFailureClassifier.Classify(
                new InvalidOperationException("Azure OpenAI returned an empty assistant message."))
            .Should()
            .Be(LlmCompletionFailureKind.SemanticTerminal);
    }

    [Fact]
    public void Classify_json_exception_is_semantic_terminal()
    {
        LlmCompletionFailureClassifier.Classify(new JsonException("invalid json"))
            .Should()
            .Be(LlmCompletionFailureKind.SemanticTerminal);
    }

    [Fact]
    public void Classify_http_400_is_semantic_terminal()
    {
        LlmCompletionFailureClassifier.Classify(new HttpRequestException("bad request", null, HttpStatusCode.BadRequest))
            .Should()
            .Be(LlmCompletionFailureKind.SemanticTerminal);
    }

    [Fact]
    public void Classify_http_429_is_transport_retryable()
    {
        LlmCompletionFailureClassifier.Classify(new HttpRequestException("rate limit", null, HttpStatusCode.TooManyRequests))
            .Should()
            .Be(LlmCompletionFailureKind.TransportRetryable);
    }

    [Fact]
    public void Classify_user_cancel_is_cancel()
    {
        using CancellationTokenSource cts = new();
        cts.Cancel();

        LlmCompletionFailureClassifier.Classify(new OperationCanceledException(cts.Token))
            .Should()
            .Be(LlmCompletionFailureKind.Cancel);
    }

    [Fact]
    public void Default_token_operation_cancel_is_not_retryable()
    {
        Exception cancelled = new OperationCanceledException("operation cancelled");
        LlmCompletionFailureClassifier.Classify(cancelled)
            .Should().Be(LlmCompletionFailureKind.Cancel);
        LlmCompletionFailureClassifier.ShouldRetry(cancelled).Should().BeFalse();
        LlmCompletionFailureClassifier.ShouldRecordCircuitBreakerFailure(cancelled).Should().BeFalse();
    }

    [Fact]
    public void Timeout_task_cancel_with_default_token_remains_retryable()
    {
        LlmCompletionFailureClassifier.Classify(new TaskCanceledException("transport timeout"))
            .Should().Be(LlmCompletionFailureKind.TransportRetryable);
    }

    [Fact]
    public void ShouldRecordCircuitBreakerFailure_returns_false_for_semantic_terminal()
    {
        LlmCompletionFailureClassifier.ShouldRecordCircuitBreakerFailure(
                new InvalidOperationException("Azure OpenAI returned an empty assistant message."))
            .Should()
            .BeFalse();
    }

    [Fact]
    public void ShouldRetry_returns_false_for_semantic_terminal()
    {
        LlmCompletionFailureClassifier.ShouldRetry(
                new InvalidOperationException("Azure OpenAI returned an empty assistant message."))
            .Should()
            .BeFalse();
    }

    [Fact]
    public void ShouldRetry_returns_false_for_circuit_breaker_open()
    {
        LlmCompletionFailureClassifier.ShouldRetry(new CircuitBreakerOpenException(DateTimeOffset.UtcNow))
            .Should()
            .BeFalse();
    }
}
