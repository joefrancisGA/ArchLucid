using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Exports;

namespace ArchLucid.Application.Exports;

public static partial class SponsorReviewPacketComposer
{
    private static void AppendTopDecisionsSection(StringBuilder sb, IReadOnlyList<SponsorReviewPacketDecisionRow>? topDecisions)
    {
        sb.AppendLine("## Top decisions");
        sb.AppendLine();

        if (topDecisions is null || topDecisions.Count == 0)
        {
            sb.AppendLine($"- {SponsorReviewPacketExportHonestyCopy.TopDecisionsNotStored}");
            sb.AppendLine();
            return;
        }

        foreach (SponsorReviewPacketDecisionRow decision in topDecisions.Take(5))
        {
            string title = SponsorReviewPacketExportHonestyCopy.FormatDecisionTitle(decision.Title);
            string selectedOption = SponsorReviewPacketExportHonestyCopy.FormatSelectedOption(decision.SelectedOption);
            sb.AppendLine($"- **{title}** — {selectedOption}");

            string confidence = string.IsNullOrWhiteSpace(decision.ConfidenceLabel)
                ? SponsorReviewPacketExportHonestyCopy.ConfidenceNotStored
                : decision.ConfidenceLabel.Trim();
            sb.AppendLine($"  - Confidence: {confidence}");

            string evidence = string.IsNullOrWhiteSpace(decision.EvidenceHref)
                ? SponsorReviewPacketExportHonestyCopy.EvidenceLinkNotStored
                : decision.EvidenceHref.Trim();
            sb.AppendLine($"  - Evidence: {evidence}");
        }

        sb.AppendLine();
    }

    private static void AppendPortfolioSignalsSection(StringBuilder sb, SponsorReviewPacketPortfolioSignals? portfolioSignals)
    {
        sb.AppendLine("## Portfolio signals (live)");
        sb.AppendLine();

        if (portfolioSignals is null)
        {
            sb.AppendLine($"- {SponsorReviewPacketExportHonestyCopy.PortfolioSignalsNotStored}");
            sb.AppendLine();
            return;
        }

        sb.AppendLine(
            $"- **Findings resolved (30d):** {portfolioSignals.ResolvedFindingsCount30Days.ToString(CultureInfo.InvariantCulture)}");
        sb.AppendLine(
            $"- **Findings discovered (30d):** {portfolioSignals.NewlyDiscoveredFindingsCount30Days.ToString(CultureInfo.InvariantCulture)}");
        sb.AppendLine(
            $"- **Stale architecture risks:** {portfolioSignals.StaleRiskCount.ToString(CultureInfo.InvariantCulture)}");
        sb.AppendLine(
            $"- **Waivers expiring (14d):** {portfolioSignals.ExpiringWaiversCount14Days.ToString(CultureInfo.InvariantCulture)}");

        sb.AppendLine();
        sb.AppendLine("### Next actions");

        IReadOnlyList<string> nextActions = portfolioSignals.NextActions
            .Take(5)
            .Select(action => string.IsNullOrWhiteSpace(action)
                ? SponsorReviewPacketExportHonestyCopy.NextActionNotStored
                : action.Trim())
            .ToList();

        if (nextActions.Count == 0)
        {
            sb.AppendLine($"- {SponsorReviewPacketExportHonestyCopy.NextActionNotStored}");
        }
        else
        {
            foreach (string action in nextActions)
            {
                sb.AppendLine($"- {action}");
            }
        }

        sb.AppendLine();
    }
}
