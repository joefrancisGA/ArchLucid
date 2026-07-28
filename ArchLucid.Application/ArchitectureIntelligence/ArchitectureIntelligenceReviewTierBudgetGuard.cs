using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Pre-flight estimated-token gate per <see cref="ArchitectureIntelligenceReviewTier"/> (TB-1992).
/// Complements tenant LLM quotas — this is ArchitectureIntelligence unit-economics, not platform quota.
/// </summary>
public sealed class ArchitectureIntelligenceReviewTierBudgetGuard : IArchitectureIntelligenceReviewTierBudgetGuard
{
    public ArchitectureIntelligenceBudgetDecision Evaluate(ClosedLoopReasoningRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        int estimatedTokens = EstimateTokens(request);
        int maxTokens = MaxEstimatedTokens(request.ReviewTier);

        if (estimatedTokens > maxTokens)
        {
            return ArchitectureIntelligenceBudgetDecision.Reject(
                estimatedTokens,
                maxTokens,
                $"Estimated {estimatedTokens} tokens exceed {request.ReviewTier} tier budget of {maxTokens}.");
        }

        return ArchitectureIntelligenceBudgetDecision.Permit(estimatedTokens, maxTokens);
    }

    internal static int MaxEstimatedTokens(ArchitectureIntelligenceReviewTier tier)
    {
        return tier switch
        {
            ArchitectureIntelligenceReviewTier.Trial => 8_000,
            ArchitectureIntelligenceReviewTier.Standard => 40_000,
            ArchitectureIntelligenceReviewTier.Deep => 120_000,
            _ => 40_000,
        };
    }

    internal static int EstimateTokens(ClosedLoopReasoningRequest request)
    {
        int sourceChars = request.SourceTexts.Sum(source => (source.Content ?? string.Empty).Length);
        int framingChars = request.FramingAnswers.Sum(pair =>
            pair.Key.Length + (pair.Value?.Length ?? 0));

        // Rough chars→tokens; plus fixed role overhead so empty sources still reserve budget.
        int contentTokens = Math.Max(1, (sourceChars + framingChars) / 4);
        int roleOverhead = request.ReviewTier switch
        {
            ArchitectureIntelligenceReviewTier.Trial => 1_500,
            ArchitectureIntelligenceReviewTier.Standard => 6_000,
            ArchitectureIntelligenceReviewTier.Deep => 18_000,
            _ => 6_000,
        };

        return contentTokens + roleOverhead;
    }
}
