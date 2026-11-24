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
        CircuitBreakerGate.CallAdmission admission = _gate.Admit();

        try
        {
            ct.ThrowIfCancellationRequested();

            // A half-open probe sends only one provider request; closed calls retain normal retries.
            bool isHalfOpenProbe = admission.IsHalfOpenProbe;
            float[] result = isHalfOpenProbe
                ? await _inner.EmbedAsync(text, ct)
                : await _llmRetryPipeline.ExecuteAsync(
                    async innerCt => await _inner.EmbedAsync(text, innerCt),
                    ct);

            admission.RecordSuccess();

            return result;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            admission.RecordCallCancelled();
            throw;
        }
        catch (Exception ex)
        {
            if (ProviderHttpFailurePolicy.ShouldRecordProviderFailure(ex))
                admission.RecordFailure();
            else
                // A semantic-terminal error is neutral; release a half-open recovery probe.
                admission.RecordCallCancelled();
            _logger.LogWarning(ex,
                "Azure OpenAI embedding call failed after retries; circuit breaker evaluated failure.");
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<float[]>> EmbedManyAsync(IReadOnlyList<string> texts, CancellationToken ct)
    {
        CircuitBreakerGate.CallAdmission admission = _gate.Admit();

        try
        {
            ct.ThrowIfCancellationRequested();

            // Batch recovery probes follow the same single-attempt budget as individual embeddings.
            bool isHalfOpenProbe = admission.IsHalfOpenProbe;
            IReadOnlyList<float[]> result = isHalfOpenProbe
                ? await _inner.EmbedManyAsync(texts, ct)
                : await _llmRetryPipeline.ExecuteAsync(
                    async innerCt => await _inner.EmbedManyAsync(texts, innerCt),
                    ct);

            admission.RecordSuccess();

            return result;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            admission.RecordCallCancelled();
            throw;
        }
        catch (Exception ex)
        {
            if (ProviderHttpFailurePolicy.ShouldRecordProviderFailure(ex))
                admission.RecordFailure();
            else
                // A semantic-terminal error is neutral; release a half-open recovery probe.
                admission.RecordCallCancelled();
            _logger.LogWarning(ex,
                "Azure OpenAI embedding batch failed after retries; circuit breaker evaluated failure.");
            throw;
        }
    }
}
