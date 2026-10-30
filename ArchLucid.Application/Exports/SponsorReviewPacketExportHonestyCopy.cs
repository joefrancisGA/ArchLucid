using ArchLucid.Application.Pilots;
using ArchLucid.Application.Reporting;
using ArchLucid.Contracts.Findings;

using System.Linq;

namespace ArchLucid.Application.Exports;

internal static class SponsorReviewPacketExportHonestyCopy
{
    internal const string DecisionTitleNotStored = "Decision title was not stored.";
    internal const string DecisionTitleStoredEmpty = "Decision title was stored empty.";
    internal const string SelectedOptionNotStored = "Selected option was not stored.";
    internal const string SelectedOptionStoredEmpty = "Selected option was stored empty.";
    internal const string NextActionNotStored = "Next action was not stored.";
    internal const string PortfolioSignalsNotStored = "Portfolio signals were not stored.";
    internal const string ConfidenceNotStored = "Confidence was not stored.";
    internal const string EvidenceLinkNotStored = "Evidence link was not stored.";
    internal const string SupportingEvidenceNotListedInPacket =
        "Supporting evidence ids and rationale were not listed in this packet.";

    internal const string SupportingFindingIdsNotStored = "Supporting finding ids were not stored.";

    internal const string SupportingFindingIdsStoredEmpty = "Supporting finding ids were stored empty.";

    internal const string DecisionRationaleNotStored = "Decision rationale was not stored.";
    internal const string TopDecisionsNotStored = "No decisions were stored for this review.";
    internal const string PricingBasisNoteNotStored = "Pricing basis note was not stored.";
    internal const string CostEvidenceFreshnessNotStored = "Cost evidence freshness was not stored.";
    internal const string TopDecisionsRemainderLine =
        "more decisions for this review were not listed in this packet.";
    internal const string PortfolioNextActionsRemainderLine =
        "more portfolio next actions were not listed in this packet.";
    internal const string ManifestNotStored = "Manifest was not stored.";
    internal const string ProofPackageNotLoaded = "Proof package was not loaded for this export.";
    internal const string RoiBasisBreakdownNotStored = "ROI basis by disposition was not stored.";
    internal const string RealizedValueNotStored = "Realized value was not stored.";
    internal const string MedianTimeToRemediationNotStored = "Median time to remediation was not stored.";

    internal static string FormatDecisionTitle(string? raw)
    {
        if (raw is null)
            return DecisionTitleNotStored;

        if (raw.Length == 0)
            return DecisionTitleStoredEmpty;

        return string.IsNullOrWhiteSpace(raw) ? DecisionTitleNotStored : raw.Trim();
    }

    internal static string FormatSelectedOption(string? raw)
    {
        if (raw is null)
            return SelectedOptionNotStored;

        if (raw.Length == 0)
            return SelectedOptionStoredEmpty;

        return string.IsNullOrWhiteSpace(raw) ? SelectedOptionNotStored : raw.Trim();
    }

    internal static string FormatSupportingFindingIdsSummary(IReadOnlyList<string>? supportingFindingIds)
    {
        if (supportingFindingIds is null)
        {
            return SupportingFindingIdsNotStored;
        }

        if (supportingFindingIds.Count == 0)
        {
            return SupportingFindingIdsStoredEmpty;
        }

        return string.Join(", ", supportingFindingIds.Select(id => id.Trim()).Where(id => id.Length > 0));
    }

    internal static string FormatDecisionRationale(string? raw)
    {
        if (raw is null)
        {
            return DecisionRationaleNotStored;
        }

        return string.IsNullOrWhiteSpace(raw) ? DecisionRationaleNotStored : raw.Trim();
    }

    internal static string FormatTopFindingTitle(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (!string.IsNullOrWhiteSpace(finding.Message))
        {
            return PilotExportPreviewHonestyCopy.FormatShortenedPreview(
                finding.Message,
                ArchitectureRunFindingsCsvFormatter.FindingMessageNotStoredLabel);
        }

        string category = string.IsNullOrWhiteSpace(finding.Category)
            ? "Finding category was not stored."
            : finding.Category.Trim();

        return $"{ArchitectureRunFindingsCsvFormatter.FindingMessageNotStoredLabel}\nCategory: {category}";
    }
}
