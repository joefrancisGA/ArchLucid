using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Text;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Safety;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Safety;

/// <summary>
///     Wraps an inner <see cref="IAgentCompletionClient" /> with Azure AI Content Safety input/output scans after upstream
///     accounting-layer prompt redaction.
/// </summary>
public sealed class ContentSafetyEnforcingAgentCompletionClient(
    IAgentCompletionClient inner,
    IContentSafetyGuard guard,
    IOptionsMonitor<ContentSafetyOptions> optionsMonitor,
    ILogger<ContentSafetyEnforcingAgentCompletionClient> logger) : IAgentStreamingCompletionClient
{
    private readonly IAgentCompletionClient _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IContentSafetyGuard _guard = guard ?? throw new ArgumentNullException(nameof(guard));

    private readonly IOptionsMonitor<ContentSafetyOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<ContentSafetyEnforcingAgentCompletionClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor => _inner.Descriptor;

    /// <inheritdoc />
    public async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ContentSafetyOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.EvaluateCompletionPromptAndResponse)
        {
            string uncheckedCompletion = await _inner.CompleteJsonAsync(
                    systemPrompt, userPrompt, maxTokens, temperature, cancellationToken)
                .ConfigureAwait(false);
            cancellationToken.ThrowIfCancellationRequested();
            return uncheckedCompletion;
        }

        ContentSafetyResult systemSafety =
            await _guard.CheckInputAsync(systemPrompt, cancellationToken).ConfigureAwait(false);
        cancellationToken.ThrowIfCancellationRequested();

        if (!systemSafety.IsAllowed)

            ThrowBlocked(systemSafety, "system_prompt");

        ContentSafetyResult userSafety =
            await _guard.CheckInputAsync(userPrompt, cancellationToken).ConfigureAwait(false);
        cancellationToken.ThrowIfCancellationRequested();

        if (!userSafety.IsAllowed)

            ThrowBlocked(userSafety, "user_prompt");

        string completionJson =
            await _inner.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken)
                .ConfigureAwait(false);
        // A non-cooperative completion may return after cancellation. Never begin a
        // second provider call for output safety or return that late completion.
        cancellationToken.ThrowIfCancellationRequested();

        ContentSafetyResult outputSafety =
            await _guard.CheckOutputAsync(completionJson, cancellationToken).ConfigureAwait(false);
        cancellationToken.ThrowIfCancellationRequested();

        if (!outputSafety.IsAllowed)

            ThrowBlocked(outputSafety, "completion_json");

        return completionJson;
    }

    /// <inheritdoc />
    public async IAsyncEnumerable<string> StreamJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ContentSafetyOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.EvaluateCompletionPromptAndResponse)
        {
            await foreach (string chunk in AgentCompletionStreamingBridge.StreamJsonAsync(
                               _inner,
                               systemPrompt,
                               userPrompt,
                               maxTokens,
                               temperature,
                               cancellationToken).ConfigureAwait(false))
            {
                yield return chunk;
            }

            yield break;
        }

        ContentSafetyResult systemSafety =
            await _guard.CheckInputAsync(systemPrompt, cancellationToken).ConfigureAwait(false);
        cancellationToken.ThrowIfCancellationRequested();

        if (!systemSafety.IsAllowed)

            ThrowBlocked(systemSafety, "system_prompt");

        ContentSafetyResult userSafety =
            await _guard.CheckInputAsync(userPrompt, cancellationToken).ConfigureAwait(false);
        cancellationToken.ThrowIfCancellationRequested();

        if (!userSafety.IsAllowed)

            ThrowBlocked(userSafety, "user_prompt");

        StringBuilder completionJson = new();
        List<string> bufferedChunks = [];

        await foreach (string chunk in AgentCompletionStreamingBridge.StreamJsonAsync(
                           _inner,
                           systemPrompt,
                           userPrompt,
                           maxTokens,
                           temperature,
                           cancellationToken).ConfigureAwait(false))
        {
            completionJson.Append(chunk);
            bufferedChunks.Add(chunk);
        }

        cancellationToken.ThrowIfCancellationRequested();
        ContentSafetyResult outputSafety =
            await _guard.CheckOutputAsync(completionJson.ToString(), cancellationToken).ConfigureAwait(false);
        cancellationToken.ThrowIfCancellationRequested();

        if (!outputSafety.IsAllowed)

            ThrowBlocked(outputSafety, "completion_json");

        // The output scan may complete after a consumer abandons the stream.
        // Never emit buffered content after cancellation, even if the guard ignored its token.
        foreach (string chunk in bufferedChunks)
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return chunk;
        }
    }

    private void ThrowBlocked(ContentSafetyResult result, string stageKey)
    {
        ArchLucidInstrumentation.LlmContentSafetyBlockedTotal.Add(
            1,
            new TagList { { "stage", stageKey }, { "category", result.Category ?? "unknown" } });

        string detail =
            string.IsNullOrWhiteSpace(result.BlockReason)
                ? $"Blocked by content safety ({stageKey})."
                : $"{stageKey}: {result.BlockReason}";

        if (_logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning("Content safety blocked completion envelope stage={Stage}: {Detail}", stageKey, detail);

        throw new InvalidOperationException(detail);
    }
}
