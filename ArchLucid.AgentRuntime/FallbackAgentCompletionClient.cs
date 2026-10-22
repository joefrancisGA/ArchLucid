using System.Runtime.CompilerServices;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Decorator that delegates to <paramref name="primary" /> and, on fallback-eligible failures, tries
///     <paramref name="fallbacks" /> in order (429 / 5xx / Azure <see cref="Azure.RequestFailedException" /> throttling).
/// </summary>
public sealed class FallbackAgentCompletionClient : IAgentStreamingCompletionClient, IDisposable
{
    /// <summary>
    ///     Set to <see langword="true" /> on the current async flow when a fallback client was used for the last
    ///     call. Consumed by <see cref="AgentCompletionModelMetadata" /> so the persisted trace carries a
    ///     <c>"fallback:"</c>-prefixed deployment name instead of silently showing the primary name.
    /// </summary>
    private static readonly AsyncLocal<bool> LastCallUsedFallback = new();

    private readonly AgentCompletionFallbackChain _fallbackChain;
    private readonly IReadOnlyList<IAgentCompletionClient> _fallbacks;
    private readonly ILogger<FallbackAgentCompletionClient> _logger;
    private readonly IAgentCompletionClient _primary;

    /// <summary>Two-client convenience ctor (primary + single fallback).</summary>
    public FallbackAgentCompletionClient(
        IAgentCompletionClient primary,
        IAgentCompletionClient secondary,
        ILogger<FallbackAgentCompletionClient> logger)
        : this(primary, new[] { secondary }, logger)
    {
    }

    /// <summary>Primary plus ordered fallback chains (each item is typically a fully composed regional client).</summary>
    public FallbackAgentCompletionClient(
        IAgentCompletionClient primary,
        IReadOnlyList<IAgentCompletionClient> fallbacks,
        ILogger<FallbackAgentCompletionClient> logger)
    {
        ArgumentNullException.ThrowIfNull(fallbacks);

        if (fallbacks.Count < 1)
        {
            throw new ArgumentException("At least one fallback client is required.", nameof(fallbacks));
        }

        _primary = primary ?? throw new ArgumentNullException(nameof(primary));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _fallbacks = fallbacks;
        _fallbackChain = new AgentCompletionFallbackChain(
            _primary,
            _fallbacks,
            _logger,
            value => LastCallUsedFallback.Value = value);
    }

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor => _primary.Descriptor;

    /// <summary>
    ///     Consumes and returns whether the last <see cref="CompleteJsonAsync" /> call on this async flow used a
    ///     fallback client. Resets the flag after reading.
    /// </summary>
    public static bool TryConsumeLastFallbackUsed()
    {
        bool value = LastCallUsedFallback.Value;
        LastCallUsedFallback.Value = false;

        return value;
    }

    /// <inheritdoc />
    public async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        LastCallUsedFallback.Value = false;
        cancellationToken.ThrowIfCancellationRequested();

        try
        {
            return await _primary.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex) when (AgentCompletionFallbackEligibility.IsFallbackEligible(ex))
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Primary LLM completion failed with a fallback-eligible error; trying {Count} fallback endpoint(s).",
                    _fallbacks.Count);
            }

            return await _fallbackChain.CompleteWithFallbacksAsync(
                systemPrompt,
                userPrompt,
                maxTokens,
                temperature,
                cancellationToken,
                ex);
        }
    }

    /// <inheritdoc />
    public async IAsyncEnumerable<string> StreamJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        await foreach (string chunk in StreamJsonWithFallbackAsync(
                           systemPrompt,
                           userPrompt,
                           maxTokens,
                           temperature,
                           cancellationToken).ConfigureAwait(false))
        {
            yield return chunk;
        }
    }

    private async IAsyncEnumerable<string> StreamJsonWithFallbackAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens,
        float? temperature,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        LastCallUsedFallback.Value = false;
        cancellationToken.ThrowIfCancellationRequested();

        Exception? primaryFailure = null;

        await using IAsyncEnumerator<string> primaryEnumerator = AgentCompletionStreamingBridge
            .StreamJsonAsync(_primary, systemPrompt, userPrompt, maxTokens, temperature, cancellationToken)
            .GetAsyncEnumerator(cancellationToken);

        while (true)
        {
            bool moved;

            try
            {
                moved = await primaryEnumerator.MoveNextAsync().ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex) when (AgentCompletionFallbackEligibility.IsFallbackEligible(ex))
            {
                primaryFailure = ex;

                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        ex,
                        "Primary LLM streaming failed with a fallback-eligible error; trying {Count} fallback endpoint(s).",
                        _fallbacks.Count);
                }

                break;
            }

            if (!moved)
            {
                yield break;
            }

            yield return primaryEnumerator.Current;
        }

        await foreach (string chunk in _fallbackChain.StreamWithFallbacksAsync(
                           systemPrompt,
                           userPrompt,
                           maxTokens,
                           temperature,
                           cancellationToken,
                           primaryFailure ?? new InvalidOperationException("Primary LLM streaming failed."))
                           .ConfigureAwait(false))
        {
            yield return chunk;
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        if (_primary is IDisposable primaryDisposable)
        {
            primaryDisposable.Dispose();
        }

        foreach (IAgentCompletionClient fb in _fallbacks)
        {
            if (fb is IDisposable d)
            {
                d.Dispose();
            }
        }
    }
}
