namespace ArchLucid.Core.Manifest;

/// <summary>Maps internal <see cref="DecisionConfidenceSource" /> values to buyer-facing labels.</summary>
public static class DecisionConfidenceSourceMapper
{
    /// <summary>Returns the buyer-facing label for a persisted enum name or raw enum value.</summary>
    public static string ToBuyerLabel(string? confidenceSource)
    {
        if (string.IsNullOrWhiteSpace(confidenceSource))
            return BuyerDecisionConfidenceSource.Unknown;

        if (!Enum.TryParse(confidenceSource.Trim(), ignoreCase: true, out DecisionConfidenceSource parsed))
            return BuyerDecisionConfidenceSource.Unknown;

        return ToBuyerLabel(parsed);
    }

    /// <summary>Returns the buyer-facing label for an internal confidence source.</summary>
    public static string ToBuyerLabel(DecisionConfidenceSource source)
    {
        return source switch
        {
            DecisionConfidenceSource.FindingEvaluation => BuyerDecisionConfidenceSource.EvidenceBacked,
            DecisionConfidenceSource.FindingAggregate => BuyerDecisionConfidenceSource.EvidenceBacked,
            DecisionConfidenceSource.RuleEngine => BuyerDecisionConfidenceSource.EvidenceBacked,
            DecisionConfidenceSource.Calibrated => BuyerDecisionConfidenceSource.EvidenceBacked,
            DecisionConfidenceSource.LlmAgent => BuyerDecisionConfidenceSource.ModelAssisted,
            DecisionConfidenceSource.Unknown => BuyerDecisionConfidenceSource.Unknown,
            DecisionConfidenceSource.NotComputed => BuyerDecisionConfidenceSource.Unknown,
            _ => BuyerDecisionConfidenceSource.Unknown,
        };
    }
}
