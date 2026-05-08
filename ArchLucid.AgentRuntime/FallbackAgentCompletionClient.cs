using System.ClientModel;

using System.Diagnostics;

using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Decorator that delegates to <paramref name="primary" /> and falls back to <paramref name="secondary" />
///     when the primary throws an <see cref="HttpRequestException" /> or <see cref="ClientResultException" /> with
///     status 429 or 5xx (matches Azure OpenAI SDK surface).
/// </summary>
public sealed class FallbackAgentCompletionClient(
    IAgentCompletionClient primary,
    IAgentCompletionClient secondary,
    ILogger<FallbackAgentCompletionClient> logger) : IAgentCompletionClient, IDisposable
{
    /// <summary>
    ///     Set to <see langword="true" /> on the current async flow when the secondary client was used for the last
    ///     call. Consumed by <see cref="AgentCompletionModelMetadata" /> so the persisted trace carries a
    ///     <c>"fallback:"</c>-prefixed deployment name instead of silently showing the primary name.
    /// </summary>
    private static readonly AsyncLocal<bool> LastCallUsedFallback = new();

    private readonly ILogger<FallbackAgentCompletionClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IAgentCompletionClient _primary =
        primary ?? throw new ArgumentNullException(nameof(primary));

    private readonly IAgentCompletionClient _secondary =
        secondary ?? throw new ArgumentNullException(nameof(secondary));

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor => _primary.Descriptor;

    /// <summary>
    ///     Consumes and returns whether the last <see cref="CompleteJsonAsync" /> call on this async flow used the
    ///     secondary (fallback) client. Resets the flag after reading.
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
        catch (HttpRequestException ex) when (IsFallbackTrigger(ex))
        {
            return await InvokeFallbackAsync(ex);
        }
        catch (ClientResultException ex) when (IsClientResultFallbackTrigger(ex))
        {
            return await InvokeFallbackAsync(ex);
        }

        async Task<string> InvokeFallbackAsync(Exception primaryFailure)
        {
            _logger.LogWarning(
                primaryFailure,
                "Primary LLM completion failed with a fallback-eligible HTTP status; using fallback completion client.");

            string result = await _secondary.CompleteJsonAsync(systemPrompt, userPrompt, cancellationToken);
            LastCallUsedFallback.Value = true;

            string deployment =
                string.IsNullOrWhiteSpace(_primary.Descriptor.ModelId)
                    ? "unknown"
                    : _primary.Descriptor.ModelId.Trim();

            ArchLucidInstrumentation.RecordLlmCompletionFallbackEngaged(deployment);

            Activity.Current?.SetTag("archlucid.llm.completion.fallback_engaged", true);
            Activity.Current?.SetTag("archlucid.llm.completion.fallback_primary_model_id", deployment);

            return result;
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        if (_primary is IDisposable primaryDisposable)

            primaryDisposable.Dispose();

        if (_secondary is IDisposable secondaryDisposable)

            secondaryDisposable.Dispose();
    }

    /// <summary>True when <paramref name="ex" /> carries status 429 or a 5xx server error.</summary>
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

    private static bool IsFallbackEligibleStatus(int statusCode)
    {
        return statusCode is 429 or >= 500 and < 600;
    }
}
