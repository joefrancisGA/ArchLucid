namespace ArchLucid.Core.Manifest;

using System.Globalization;

/// <summary>Maps internal <see cref="DecisionConfidenceSource" /> values to buyer-facing labels.</summary>
public static class DecisionConfidenceSourceMapper
{
    /// <summary>Returns the buyer-facing label for a persisted enum name or raw enum value.</summary>
    public static string ToBuyerLabel(string? confidenceSource)
    {
        if (string.IsNullOrWhiteSpace(confidenceSource))
            return BuyerDecisionConfidenceSource.Unknown;

        string trimmed = confidenceSource.Trim();

        if (Enum.TryParse(trimmed, ignoreCase: true, out DecisionConfidenceSource parsed)
            && Enum.IsDefined(parsed))
        {
            return ToBuyerLabel(parsed);
        }

        if (TryParseWholeNumberString(trimmed, out int ordinal)
            && Enum.IsDefined(typeof(DecisionConfidenceSource), ordinal))
        {
            return ToBuyerLabel((DecisionConfidenceSource)ordinal);
        }

        return BuyerDecisionConfidenceSource.Unknown;
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

    private static bool TryParseWholeNumberString(string raw, out int value)
    {
        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }
}
