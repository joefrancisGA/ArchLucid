using Microsoft.Extensions.Logging;

using Polly;
using Polly.CircuitBreaker;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Wraps a distributed LLM completion cache with a circuit breaker and in-process fallback so Redis outages do not
///     block agent completions.
/// </summary>
public sealed class ResilientDistributedLlmCompletionResponseStore : ILlmCompletionResponseStore, IDisposable
{
    private readonly ResiliencePipeline _circuitBreaker;
    private readonly ILlmCompletionResponseStore _distributed;
    private readonly MemoryLlmCompletionResponseStore _fallback;
    private readonly ILogger<ResilientDistributedLlmCompletionResponseStore> _logger;

    public ResilientDistributedLlmCompletionResponseStore(
        ILlmCompletionResponseStore distributedStore,
        MemoryLlmCompletionResponseStore fallbackStore,
        ResiliencePipeline circuitBreaker,
        ILogger<ResilientDistributedLlmCompletionResponseStore> logger)
    {
        _distributed = distributedStore ?? throw new ArgumentNullException(nameof(distributedStore));
        _fallback = fallbackStore ?? throw new ArgumentNullException(nameof(fallbackStore));
        _circuitBreaker = circuitBreaker ?? throw new ArgumentNullException(nameof(circuitBreaker));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public void Dispose()
    {
        _fallback.Dispose();
    }

    /// <inheritdoc />
    public async Task<string?> TryGetAsync(string key, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);

        try
        {
            return await _circuitBreaker.ExecuteAsync(
                async ct => await _distributed.TryGetAsync(key, ct),
                cancellationToken);
        }
        catch (BrokenCircuitException ex)
        {
            if (_logger.IsEnabled(LogLevel.Debug))

                _logger.LogDebug(ex, "Distributed LLM completion cache circuit is open; reading from in-memory fallback.");

            return await _fallback.TryGetAsync(key, cancellationToken);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Debug))

                _logger.LogDebug(ex, "Distributed LLM completion cache read failed; reading from in-memory fallback.");

            return await _fallback.TryGetAsync(key, cancellationToken);
        }
    }

    /// <inheritdoc />
    public async Task SetAsync(string key, string value, TimeSpan absoluteExpiration, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        ArgumentNullException.ThrowIfNull(value);

        if (absoluteExpiration <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(absoluteExpiration));

        try
        {
            await _circuitBreaker.ExecuteAsync(
                async ct =>
                {
                    await _distributed.SetAsync(key, value, absoluteExpiration, ct);

                    return true;
                },
                cancellationToken);
        }
        catch (BrokenCircuitException ex)
        {
            if (_logger.IsEnabled(LogLevel.Debug))

                _logger.LogDebug(ex, "Distributed LLM completion cache circuit is open; writing to in-memory fallback only.");

            await _fallback.SetAsync(key, value, absoluteExpiration, cancellationToken);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Debug))

                _logger.LogDebug(ex, "Distributed LLM completion cache write failed; writing to in-memory fallback only.");

            await _fallback.SetAsync(key, value, absoluteExpiration, cancellationToken);
        }
    }
}
