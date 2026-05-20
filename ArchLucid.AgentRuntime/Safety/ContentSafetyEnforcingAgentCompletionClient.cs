using System.Diagnostics;

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
    ILogger<ContentSafetyEnforcingAgentCompletionClient> logger) : IAgentCompletionClient
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
        ContentSafetyOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.EvaluateCompletionPromptAndResponse)

            return await _inner.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken)
                .ConfigureAwait(false);

        ContentSafetyResult systemSafety =
            await _guard.CheckInputAsync(systemPrompt, cancellationToken).ConfigureAwait(false);

        if (!systemSafety.IsAllowed)

            ThrowBlocked(systemSafety, "system_prompt");

        ContentSafetyResult userSafety =
            await _guard.CheckInputAsync(userPrompt, cancellationToken).ConfigureAwait(false);

        if (!userSafety.IsAllowed)

            ThrowBlocked(userSafety, "user_prompt");

        string completionJson =
            await _inner.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken)
                .ConfigureAwait(false);

        ContentSafetyResult outputSafety =
            await _guard.CheckOutputAsync(completionJson, cancellationToken).ConfigureAwait(false);

        if (!outputSafety.IsAllowed)

            ThrowBlocked(outputSafety, "completion_json");

        return completionJson;
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
