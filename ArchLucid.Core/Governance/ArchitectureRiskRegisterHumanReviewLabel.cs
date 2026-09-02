using System.Globalization;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Governance;

/// <summary>Buyer-facing labels for inbound-sync human review state on risk-register rows (TB-063).</summary>
public static class ArchitectureRiskRegisterHumanReviewLabel
{
    public static string Format(FindingHumanReviewStatus status)
    {
        return status switch
        {
            FindingHumanReviewStatus.NotRequired => "No human review required",
            FindingHumanReviewStatus.Pending => "Human review pending",
            FindingHumanReviewStatus.Approved => "Human review approved",
            FindingHumanReviewStatus.Rejected => "Human review rejected",
            FindingHumanReviewStatus.Overridden => "Human review overridden",
            _ => status.ToString(),
        };
    }

    public static FindingHumanReviewStatus ParseOrDefault(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return FindingHumanReviewStatus.NotRequired;

        string trimmed = raw.Trim();

        if (TryParseWholeNumberString(trimmed, out int numeric))
        {
            if (Enum.IsDefined(typeof(FindingHumanReviewStatus), numeric))
                return (FindingHumanReviewStatus)numeric;

            return FindingHumanReviewStatus.NotRequired;
        }

        if (TryParseBooleanOrdinalString(trimmed, out int booleanOrdinal)
            && Enum.IsDefined(typeof(FindingHumanReviewStatus), booleanOrdinal))
        {
            return (FindingHumanReviewStatus)booleanOrdinal;
        }

        if (Enum.TryParse(trimmed, true, out FindingHumanReviewStatus status) &&
            Enum.IsDefined(typeof(FindingHumanReviewStatus), status))
            return status;

        return FindingHumanReviewStatus.NotRequired;
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

    private static bool TryParseBooleanOrdinalString(string? raw, out int ordinal)
    {
        if (TryParseBooleanString(raw, out bool boolean))
        {
            ordinal = boolean ? 1 : 0;

            return true;
        }

        ordinal = default;

        return false;
    }

    private static bool TryParseBooleanString(string? raw, out bool value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (trimmed.Equals("true", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("1", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("yes", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("on", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("enabled", StringComparison.OrdinalIgnoreCase))
        {
            value = true;

            return true;
        }

        if (trimmed.Equals("false", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("0", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("no", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("off", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("disabled", StringComparison.OrdinalIgnoreCase))
        {
            value = false;

            return true;
        }

        value = default;

        return false;
    }
}
