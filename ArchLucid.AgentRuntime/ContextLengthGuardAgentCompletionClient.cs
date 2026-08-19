using ArchLucid.AgentRuntime.Tokens;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Chunking;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Decorator: estimates prompt tokens and summarizes, truncates, or rejects before the inner completion client runs.
/// </summary>
public sealed class ContextLengthGuardAgentCompletionClient(
    IAgentCompletionClient inner,
    ITokenCounter tokenCounter,
    IOptionsMonitor<LlmContextWindowOptions> contextOptions,
    IOptionsMonitor<EvidenceSummarizationOptions> summarizationOptions,
    IEvidenceSummarizationService evidenceSummarizationService,
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

    private readonly IOptionsMonitor<EvidenceSummarizationOptions> _summarizationOptions =
        summarizationOptions ?? throw new ArgumentNullException(nameof(summarizationOptions));

    private readonly IEvidenceSummarizationService _evidenceSummarizationService =
        evidenceSummarizationService ?? throw new ArgumentNullException(nameof(evidenceSummarizationService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ILogger<ContextLengthGuardAgentCompletionClient> _logger =
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
        LlmContextWindowOptions opts = _contextOptions.CurrentValue;

        if (!opts.Enabled || opts.MaxContextTokens < 1)
            return await _inner
                .CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken)
                .ConfigureAwait(false);

        int estimated = _tokenCounter.CountTokens(systemPrompt) + _tokenCounter.CountTokens(userPrompt);
        int threshold = (int)Math.Floor(opts.MaxContextTokens * Math.Clamp(opts.ThresholdRatio, 0.5, 0.99));

        if (estimated <= threshold)
        {
            return await _inner
                .CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken)
                .ConfigureAwait(false);
        }

        if (opts.TruncateUserPromptOnExceeded)
        {
            int systemTokens = _tokenCounter.CountTokens(systemPrompt);
            int remainingBudget = Math.Max(1, threshold - systemTokens);
            string effectiveUserPrompt = userPrompt;
            int effectiveEstimated = estimated;

            if (_summarizationOptions.CurrentValue.Enabled)
            {
                string summarizedUserPrompt = await _evidenceSummarizationService
                    .SummarizeAsync(userPrompt, remainingBudget, AgentType.Topology, cancellationToken)
                    .ConfigureAwait(false);

                int summarizedEstimated =
                    _tokenCounter.CountTokens(systemPrompt) + _tokenCounter.CountTokens(summarizedUserPrompt);

                if (!string.Equals(summarizedUserPrompt, userPrompt, StringComparison.Ordinal)
                    && summarizedEstimated <= threshold)
                {
                    ScheduleSummarizationAudit(estimated, summarizedEstimated, threshold, opts.MaxContextTokens);
                    effectiveUserPrompt = summarizedUserPrompt;
                    effectiveEstimated = summarizedEstimated;
                }
            }

            if (effectiveEstimated <= threshold)
            {
                return await _inner
                    .CompleteJsonAsync(systemPrompt, effectiveUserPrompt, maxTokens, temperature, cancellationToken)
                    .ConfigureAwait(false);
            }

            string truncatedUser = TokenAwareContextBudget.TruncateToTokenBudget(
                effectiveUserPrompt,
                out bool wasTruncated,
                maxEstimatedTokens: remainingBudget);

            if (wasTruncated)
                ScheduleTruncationAudit(effectiveEstimated, threshold, opts.MaxContextTokens);

            return await _inner
                .CompleteJsonAsync(systemPrompt, truncatedUser, maxTokens, temperature, cancellationToken)
                .ConfigureAwait(false);
        }

        throw new ContextLengthExceededException(estimated, opts.MaxContextTokens, threshold);
    }

    [InformationalAudit]
    private void ScheduleSummarizationAudit(
        int estimatedTokensBefore,
        int estimatedTokensAfter,
        int thresholdTokens,
        int maxContextTokens)
    {
        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "LLM evidence summarized before completion. EstimatedBefore={EstimatedBefore}, EstimatedAfter={EstimatedAfter}, Threshold={Threshold}, MaxContext={MaxContext}",
                estimatedTokensBefore,
                estimatedTokensAfter,
                thresholdTokens,
                maxContextTokens);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        _ = _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.LlmEvidenceSummarized,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson =
                    $"{{\"estimatedTokensBefore\":{estimatedTokensBefore},\"estimatedTokensAfter\":{estimatedTokensAfter},\"thresholdTokens\":{thresholdTokens},\"maxContextTokens\":{maxContextTokens}}}",
            },
            CancellationToken.None);
    }

    [InformationalAudit]
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
