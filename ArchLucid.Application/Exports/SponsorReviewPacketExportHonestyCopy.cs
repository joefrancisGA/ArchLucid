using ArchLucid.Application.Reporting;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Exports;

internal static class SponsorReviewPacketExportHonestyCopy
{
    internal const string DecisionTitleNotStored = "Decision title was not stored.";
    internal const string SelectedOptionNotStored = "Selected option was not stored.";
    internal const string NextActionNotStored = "Next action was not stored.";
    internal const string PortfolioSignalsNotStored = "Portfolio signals were not stored.";
    internal const string ConfidenceNotStored = "Confidence was not stored.";
    internal const string EvidenceLinkNotStored = "Evidence link was not stored.";
    internal const string TopDecisionsNotStored = "No decisions were stored for this review.";
    internal const string PricingBasisNoteNotStored = "Pricing basis note was not stored.";
    internal const string CostEvidenceFreshnessNotStored = "Cost evidence freshness was not stored.";

    internal static string FormatDecisionTitle(string? raw) =>
        string.IsNullOrWhiteSpace(raw) ? DecisionTitleNotStored : raw.Trim();

    internal static string FormatSelectedOption(string? raw) =>
        string.IsNullOrWhiteSpace(raw) ? SelectedOptionNotStored : raw.Trim();

    internal static string FormatTopFindingTitle(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (!string.IsNullOrWhiteSpace(finding.Message))
            return finding.Message.Trim();

        string category = string.IsNullOrWhiteSpace(finding.Category)
            ? "Finding category was not stored."
            : finding.Category.Trim();

        return $"{ArchitectureRunFindingsCsvFormatter.FindingMessageNotStoredLabel}\nCategory: {category}";
    }
}
