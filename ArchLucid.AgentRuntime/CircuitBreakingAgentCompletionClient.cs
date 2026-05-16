using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Resilience;

using Microsoft.Extensions.Logging;

using Polly;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Decorator for <see cref="IAgentCompletionClient" /> that applies a <see cref="CircuitBreakerGate" /> around Azure
///     OpenAI calls.
/// </summary>
public sealed class CircuitBreakingAgentCompletionClient(
    IAgentCompletionClient inner,
    CircuitBreakerGate gate,
    ResiliencePipeline llmRetryPipeline,
    ILogger<CircuitBreakingAgentCompletionClient> logger) : IAgentCompletionClient, IDisposable
{
    private readonly CircuitBreakerGate _gate = gate ?? throw new ArgumentNullException(nameof(gate));
    private readonly IAgentCompletionClient _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly ResiliencePipeline _llmRetryPipeline =
        llmRetryPipeline ?? throw new ArgumentNullException(nameof(llmRetryPipeline));

    private readonly ILogger<CircuitBreakingAgentCompletionClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor => _inner.Descriptor;

    /// <inheritdoc />
    public async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _gate.ThrowIfBroken();
        }
        catch (CircuitBreakerOpenException ex)
        {
            string safeGate = LogSanitizer.Sanitize(_gate.GateName);

            _logger.LogWarning(
                ex,
                "LLM circuit gate {GateName} rejected call (state {State}, retry after {RetryAfter}).",
                safeGate,
                _gate.CurrentState,
                ex.RetryAfterUtc); // codeql[cs/log-forging]: gate name sanitized; state is circuit state string; RetryAfterUtc is DateTimeOffset.
            throw;
        }

        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            // Snapshot after ThrowIfBroken (HalfOpen probes may transition Open → HalfOpen there).
            string stateBeforeOutcome = _gate.CurrentState;

            string result = await _llmRetryPipeline.ExecuteAsync(
                async ct => await _inner.CompleteJsonAsync(systemPrompt, userPrompt, ct),
                cancellationToken);

            _gate.RecordSuccess();

            if (stateBeforeOutcome.Equals("HalfOpen", StringComparison.Ordinal) &&
                _gate.CurrentState.Equals("Closed", StringComparison.Ordinal))
            {
                string safeGate = LogSanitizer.Sanitize(_gate.GateName);

                _logger.LogInformation(
                    "LLM Circuit Breaker reset; circuit closed and completions may proceed. Gate={GateName}.",
                    safeGate);
            }

            return result;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            _gate.RecordCallCancelled();
            throw;
        }
        catch (Exception ex)
        {
            string stateBeforeFailure = _gate.CurrentState;

            _gate.RecordFailure();

            if (_gate.CurrentState.Equals("Open", StringComparison.Ordinal) &&
                (stateBeforeFailure.Equals("Closed", StringComparison.Ordinal) ||
                 stateBeforeFailure.Equals("HalfOpen", StringComparison.Ordinal)))
            {
                string safeGate = LogSanitizer.Sanitize(_gate.GateName);

                _logger.LogWarning(
                    "LLM Circuit Breaker opened due to consecutive failures. Gate={GateName}.",
                    safeGate);
            }

            _logger.LogWarning(ex, "LLM completion call failed after retries; circuit breaker recorded failure.");
            throw;
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        if (_inner is IDisposable disposableInner)

            disposableInner.Dispose();
    }
}
