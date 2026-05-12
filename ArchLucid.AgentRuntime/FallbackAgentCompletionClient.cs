using System.ClientModel;
using System.Diagnostics;

using ArchLucid.Core.Diagnostics;

using Azure;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Decorator that delegates to <paramref name="primary" /> and, on fallback-eligible failures, tries
///     <paramref name="fallbacks" /> in order (429 / 5xx / Azure <see cref="RequestFailedException" /> throttling).
/// </summary>
public sealed class FallbackAgentCompletionClient : IAgentCompletionClient, IDisposable
{
    /// <summary>
    ///     Set to <see langword="true" /> on the current async flow when a fallback client was used for the last
    ///     call. Consumed by <see cref="AgentCompletionModelMetadata" /> so the persisted trace carries a
    ///     <c>"fallback:"</c>-prefixed deployment name instead of silently showing the primary name.
    /// </summary>
    private static readonly AsyncLocal<bool> LastCallUsedFallback = new();

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
            throw new ArgumentException("At least one fallback client is required.", nameof(fallbacks));

        _primary = primary ?? throw new ArgumentNullException(nameof(primary));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _fallbacks = fallbacks;
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
        CancellationToken cancellationToken = default)
    {
        LastCallUsedFallback.Value = false;
        cancellationToken.ThrowIfCancellationRequested();

        try
        {
            return await _primary.CompleteJsonAsync(systemPrompt, userPrompt, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex) when (IsFallbackEligible(ex))
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(
                    ex,
                    "Primary LLM completion failed with a fallback-eligible error; trying {Count} fallback endpoint(s).",
                    _fallbacks.Count);

            return await CompleteWithFallbacksAsync(systemPrompt, userPrompt, cancellationToken, ex);
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        if (_primary is IDisposable primaryDisposable)

            primaryDisposable.Dispose();

        foreach (IAgentCompletionClient fb in _fallbacks)
        {
            if (fb is IDisposable d)

                d.Dispose();
        }
    }

    private async Task<string> CompleteWithFallbacksAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken,
        Exception primaryFailure)
    {
        Exception? last = primaryFailure;

        for (int i = 0; i < _fallbacks.Count; i++)
        {
            IAgentCompletionClient client = _fallbacks[i];

            try
            {
                string result = await client.CompleteJsonAsync(systemPrompt, userPrompt, cancellationToken);
                LastCallUsedFallback.Value = true;

                string deployment =
                    string.IsNullOrWhiteSpace(_primary.Descriptor.ModelId)
                        ? "unknown"
                        : _primary.Descriptor.ModelId.Trim();

                ArchLucidInstrumentation.RecordLlmCompletionFallbackEngaged(deployment);

                Activity.Current?.SetTag("archlucid.llm.completion.fallback_engaged", true);
                Activity.Current?.SetTag("archlucid.llm.completion.fallback_primary_model_id", deployment);
                Activity.Current?.SetTag("archlucid.llm.completion.fallback_index", i);

                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning(
                        "LLM completion succeeded using fallback endpoint index {FallbackIndex} (of {Total}).",
                        i,
                        _fallbacks.Count);

                return result;
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex) when (i < _fallbacks.Count - 1 && IsFallbackEligible(ex))
            {
                last = ex;

                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning(
                        ex,
                        "Fallback LLM completion index {FallbackIndex} failed with a retryable error; trying next fallback.",
                        i);
            }
        }

        throw last ?? primaryFailure;
    }

    /// <summary>True when <paramref name="ex" /> carries status 429 or a 5xx server error.</summary>
    private static bool IsFallbackEligible(Exception ex)
    {
        if (ex is HttpRequestException http)
            return IsFallbackTrigger(http);

        if (ex is ClientResultException cre)
            return IsClientResultFallbackTrigger(cre);

        if (ex is RequestFailedException rfe)
            return IsRequestFailedFallbackTrigger(rfe);

        return false;
    }

    private static bool IsFallbackTrigger(HttpRequestException ex)
    {
        if (ex.StatusCode is not { } statusCode)
            return false;

        int code = (int)statusCode;

        return code is 429 or >= 500 and < 600;
    }

    /// <summary>Azure OpenAI SDK path: <see cref="ClientResultException" /> carries the HTTP status.</summary>
    private static bool IsClientResultFallbackTrigger(ClientResultException ex)
    {
        return IsFallbackEligibleStatus(ex.Status);
    }

    /// <summary>Azure.Core path: <see cref="RequestFailedException" /> (e.g. 429 / 503 from HTTP pipeline).</summary>
    private static bool IsRequestFailedFallbackTrigger(RequestFailedException ex)
    {
        return IsFallbackEligibleStatus(ex.Status);
    }

    private static bool IsFallbackEligibleStatus(int statusCode)
    {
        return statusCode is 429 or >= 500 and < 600;
    }
}
