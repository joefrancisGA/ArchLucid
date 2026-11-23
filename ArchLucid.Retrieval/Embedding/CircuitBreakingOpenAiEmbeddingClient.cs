using ArchLucid.Core.Resilience;

using Microsoft.Extensions.Logging;

using Polly;

namespace ArchLucid.Retrieval.Embedding;

/// <summary>
///     Decorator for <see cref="IOpenAiEmbeddingClient" /> that applies a <see cref="CircuitBreakerGate" /> around
///     embedding calls.
/// </summary>
public sealed class CircuitBreakingOpenAiEmbeddingClient : IOpenAiEmbeddingClient
{
    private readonly CircuitBreakerGate _gate;
    private readonly IOpenAiEmbeddingClient _inner;
    private readonly ResiliencePipeline _llmRetryPipeline;
    private readonly ILogger<CircuitBreakingOpenAiEmbeddingClient> _logger;

    public CircuitBreakingOpenAiEmbeddingClient(
        IOpenAiEmbeddingClient inner,
        CircuitBreakerGate gate,
        ResiliencePipeline llmRetryPipeline,
        ILogger<CircuitBreakingOpenAiEmbeddingClient> logger)
    {
        ArgumentNullException.ThrowIfNull(inner);
        ArgumentNullException.ThrowIfNull(gate);
        ArgumentNullException.ThrowIfNull(llmRetryPipeline);
        ArgumentNullException.ThrowIfNull(logger);

        _inner = inner;
        _gate = gate;
        _llmRetryPipeline = llmRetryPipeline;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<float[]> EmbedAsync(string text, CancellationToken ct)
    {
        _gate.ThrowIfBroken();

        try
        {
            ct.ThrowIfCancellationRequested();

            // A half-open probe sends only one provider request; closed calls retain normal retries.
            bool isHalfOpenProbe = _gate.CurrentState.Equals("HalfOpen", StringComparison.Ordinal);
            float[] result = isHalfOpenProbe
                ? await _inner.EmbedAsync(text, ct)
                : await _llmRetryPipeline.ExecuteAsync(
                    async innerCt => await _inner.EmbedAsync(text, innerCt),
                    ct);

            _gate.RecordSuccess();

            return result;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            _gate.RecordCallCancelled();
            throw;
        }
        catch (Exception ex)
        {
            if (ProviderHttpFailurePolicy.ShouldRecordProviderFailure(ex))
                _gate.RecordFailure();
            else
                // A semantic-terminal error is neutral; release a half-open recovery probe.
                _gate.RecordCallCancelled();
            _logger.LogWarning(ex,
                "Azure OpenAI embedding call failed after retries; circuit breaker evaluated failure.");
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<float[]>> EmbedManyAsync(IReadOnlyList<string> texts, CancellationToken ct)
    {
        _gate.ThrowIfBroken();

        try
        {
            ct.ThrowIfCancellationRequested();

            // Batch recovery probes follow the same single-attempt budget as individual embeddings.
            bool isHalfOpenProbe = _gate.CurrentState.Equals("HalfOpen", StringComparison.Ordinal);
            IReadOnlyList<float[]> result = isHalfOpenProbe
                ? await _inner.EmbedManyAsync(texts, ct)
                : await _llmRetryPipeline.ExecuteAsync(
                    async innerCt => await _inner.EmbedManyAsync(texts, innerCt),
                    ct);

            _gate.RecordSuccess();

            return result;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            _gate.RecordCallCancelled();
            throw;
        }
        catch (Exception ex)
        {
            if (ProviderHttpFailurePolicy.ShouldRecordProviderFailure(ex))
                _gate.RecordFailure();
            else
                // A semantic-terminal error is neutral; release a half-open recovery probe.
                _gate.RecordCallCancelled();
            _logger.LogWarning(ex,
                "Azure OpenAI embedding batch failed after retries; circuit breaker evaluated failure.");
            throw;
        }
    }
}
