using System.Diagnostics;
using System.Runtime.CompilerServices;

using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

internal sealed class AgentCompletionFallbackChain
{
    private readonly IReadOnlyList<IAgentCompletionClient> _fallbacks;
    private readonly ILogger _logger;
    private readonly IAgentCompletionClient _primary;
    private readonly Action<bool> _setLastCallUsedFallback;

    internal AgentCompletionFallbackChain(
        IAgentCompletionClient primary,
        IReadOnlyList<IAgentCompletionClient> fallbacks,
        ILogger logger,
        Action<bool> setLastCallUsedFallback)
    {
        _primary = primary ?? throw new ArgumentNullException(nameof(primary));
        _fallbacks = fallbacks ?? throw new ArgumentNullException(nameof(fallbacks));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _setLastCallUsedFallback = setLastCallUsedFallback ?? throw new ArgumentNullException(nameof(setLastCallUsedFallback));
    }

    internal async Task<string> CompleteWithFallbacksAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens,
        float? temperature,
        CancellationToken cancellationToken,
        Exception primaryFailure)
    {
        Exception? last = primaryFailure;

        for (int i = 0; i < _fallbacks.Count; i++)
        {
            IAgentCompletionClient client = _fallbacks[i];

            try
            {
                string result = await client.CompleteJsonAsync(
                    systemPrompt,
                    userPrompt,
                    maxTokens,
                    temperature,
                    cancellationToken);
                RecordFallbackEngaged(i, streaming: false);

                return result;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex) when (i < _fallbacks.Count - 1 && AgentCompletionFallbackEligibility.IsFallbackEligible(ex))
            {
                last = ex;

                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        ex,
                        "Fallback LLM completion index {FallbackIndex} failed with a retryable error; trying next fallback.",
                        i);
                }
            }
        }

        throw last ?? primaryFailure;
    }

    internal async IAsyncEnumerable<string> StreamWithFallbacksAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens,
        float? temperature,
        [EnumeratorCancellation] CancellationToken cancellationToken,
        Exception primaryFailure)
    {
        Exception? last = primaryFailure;

        for (int i = 0; i < _fallbacks.Count; i++)
        {
            IAgentCompletionClient client = _fallbacks[i];

            Exception? iterationFailure = null;
            bool completed = false;

            await using IAsyncEnumerator<string> fallbackEnumerator = AgentCompletionStreamingBridge
                .StreamJsonAsync(client, systemPrompt, userPrompt, maxTokens, temperature, cancellationToken)
                .GetAsyncEnumerator(cancellationToken);

            while (true)
            {
                bool moved;

                try
                {
                    moved = await fallbackEnumerator.MoveNextAsync().ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception ex) when (i < _fallbacks.Count - 1 && AgentCompletionFallbackEligibility.IsFallbackEligible(ex))
                {
                    iterationFailure = ex;

                    if (_logger.IsEnabled(LogLevel.Warning))
                    {
                        _logger.LogWarning(
                            ex,
                            "Fallback LLM streaming index {FallbackIndex} failed with a retryable error; trying next fallback.",
                            i);
                    }

                    break;
                }

                if (!moved)
                {
                    completed = true;
                    break;
                }

                yield return fallbackEnumerator.Current;
            }

            if (completed)
            {
                RecordFallbackEngaged(i, streaming: true);
                yield break;
            }

            last = iterationFailure ?? last;
        }

        throw last ?? primaryFailure;
    }

    private void RecordFallbackEngaged(int fallbackIndex, bool streaming)
    {
        _setLastCallUsedFallback(true);

        string deployment =
            string.IsNullOrWhiteSpace(_primary.Descriptor.ModelId)
                ? "unknown"
                : _primary.Descriptor.ModelId.Trim();

        ArchLucidInstrumentation.RecordLlmCompletionFallbackEngaged(deployment);

        Activity.Current?.SetTag("archlucid.llm.completion.fallback_engaged", true);
        Activity.Current?.SetTag("archlucid.llm.completion.fallback_primary_model_id", deployment);
        Activity.Current?.SetTag("archlucid.llm.completion.fallback_index", fallbackIndex);

        if (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                streaming
                    ? "LLM streaming succeeded using fallback endpoint index {FallbackIndex} (of {Total})."
                    : "LLM completion succeeded using fallback endpoint index {FallbackIndex} (of {Total}).",
                fallbackIndex,
                _fallbacks.Count);
        }
    }
}
