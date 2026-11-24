using System.Text;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Reserves bounded semantic-review capacity across concurrent findings in the same gateway scope.</summary>
internal sealed class SemanticVerificationBudget(
    ArchitectureIntelligencePipelineOptions options, ILlmCostEstimator? estimator)
{
    private const int PromptProtocolTokenAllowance = 512;
    private readonly object _gate = new();
    private int _reservedTokens;
    private decimal _reservedEstimatedUsd;

    internal (int OutputTokens, TimeSpan Timeout) Reserve(string claim, string systemPrompt, string userPrompt)
    {
        int severityStart = claim.IndexOf(':') + 1;
        int severityEnd = claim.IndexOf(':', severityStart);
        bool material = severityStart > 0 && severityEnd > severityStart &&
            SelectiveHighSeverityAdversarialPolicy.IsHighOrCriticalSeverity(claim[severityStart..severityEnd]);

        int outputTokens = material ? 256 : 128;
        int maxInputTokens = material ? 8_192 : 2_048;
        // UTF-8 bytes conservatively size byte-tokenized text. Keep a separate protocol allowance.
        long inputTokens = (long)Encoding.UTF8.GetByteCount(systemPrompt) +
            Encoding.UTF8.GetByteCount(userPrompt) + PromptProtocolTokenAllowance;
        if (inputTokens > maxInputTokens)
            throw new SemanticVerificationDeferredException("The cited prompt exceeded its semantic verification token limit.");

        int reserveTokens = (int)inputTokens + outputTokens;
        int tokenAllowance = options.SemanticVerificationTokenAllowance;
        decimal usdAllowance = options.SemanticVerificationEstimatedUsdAllowance;
        // Reserve half the shared capacity for High and Critical findings.
        if (!material)
        {
            tokenAllowance /= 2;
            usdAllowance /= 2;
        }

        TimeSpan timeout = options.SemanticVerificationCallTimeout;
        if (timeout <= TimeSpan.Zero || timeout > TimeSpan.FromMinutes(1))
            throw new SemanticVerificationDeferredException("The semantic verification deadline is unavailable.");
        if (!material)
            timeout /= 2;

        lock (_gate)
        {
            if (tokenAllowance <= 0 || reserveTokens > tokenAllowance - _reservedTokens)
                throw new SemanticVerificationDeferredException("The remaining semantic verification token budget was exhausted.");

            decimal? cost = estimator?.EstimateUsd((int)inputTokens, outputTokens);
            if (cost is null or < 0m)
                throw new SemanticVerificationDeferredException("The estimated cost for semantic verification is unavailable.");
            if (usdAllowance <= 0m || cost.Value > usdAllowance - _reservedEstimatedUsd)
                throw new SemanticVerificationDeferredException("The remaining estimated semantic verification cost budget was exhausted.");

            // Keep the reservation after timeout or failure because the provider may already have billed the attempt.
            _reservedTokens += reserveTokens;
            _reservedEstimatedUsd += cost.Value;
        }

        return (outputTokens, timeout);
    }
}

internal sealed class SemanticVerificationDeferredException(string message) : Exception(message);
