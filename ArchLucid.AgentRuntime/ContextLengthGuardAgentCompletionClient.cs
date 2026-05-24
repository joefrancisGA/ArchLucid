using ArchLucid.AgentRuntime.Tokens;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Chunking;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Decorator: estimates prompt tokens and truncates or rejects before the inner completion client runs.
/// </summary>
public sealed class ContextLengthGuardAgentCompletionClient(
    IAgentCompletionClient inner,
    ITokenCounter tokenCounter,
    IOptionsMonitor<LlmContextWindowOptions> contextOptions,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    ILogger<ContextLengthGuardAgentCompletionClient> logger) : IAgentCompletionClient
{
    private readonly IAgentCompletionClient _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly ITokenCounter _tokenCounter =
        tokenCounter ?? throw new ArgumentNullException(nameof(tokenCounter));

    private readonly IOptionsMonitor<LlmContextWindowOptions> _contextOptions =
        contextOptions ?? throw new ArgumentNullException(nameof(contextOptions));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ILogger<ContextLengthGuardAgentCompletionClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor => _inner.Descriptor;

    /// <inheritdoc />
    public Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        LlmContextWindowOptions opts = _contextOptions.CurrentValue;

        if (!opts.Enabled || opts.MaxContextTokens < 1)
            return _inner.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken);

        int estimated = _tokenCounter.CountTokens(systemPrompt) + _tokenCounter.CountTokens(userPrompt);
        int threshold = (int)Math.Floor(opts.MaxContextTokens * Math.Clamp(opts.ThresholdRatio, 0.5, 0.99));

        if (estimated <= threshold)
            return _inner.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken);

        if (opts.TruncateUserPromptOnExceeded)
        {
            int systemTokens = _tokenCounter.CountTokens(systemPrompt);
            int remainingBudget = Math.Max(1, threshold - systemTokens);
            string truncatedUser = TokenAwareContextBudget.TruncateToTokenBudget(
                userPrompt,
                out bool wasTruncated,
                maxEstimatedTokens: remainingBudget);

            if (wasTruncated)
                ScheduleTruncationAudit(estimated, threshold, opts.MaxContextTokens);

            return _inner.CompleteJsonAsync(systemPrompt, truncatedUser, maxTokens, temperature, cancellationToken);
        }

        throw new ContextLengthExceededException(estimated, opts.MaxContextTokens, threshold);
    }

    private void ScheduleTruncationAudit(int estimatedTokens, int thresholdTokens, int maxContextTokens)
    {
        if (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "LLM prompt truncated before completion. EstimatedTokens={Estimated}, Threshold={Threshold}, MaxContext={MaxContext}",
                estimatedTokens,
                thresholdTokens,
                maxContextTokens);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        _ = _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.LlmContextTruncated,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson =
                    $"{{\"estimatedTokens\":{estimatedTokens},\"thresholdTokens\":{thresholdTokens},\"maxContextTokens\":{maxContextTokens}}}",
            },
            CancellationToken.None);
    }
}
