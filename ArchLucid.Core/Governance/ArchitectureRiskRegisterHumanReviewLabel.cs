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

        return Enum.TryParse(raw.Trim(), true, out FindingHumanReviewStatus status)
            ? status
            : FindingHumanReviewStatus.NotRequired;
    }
}
