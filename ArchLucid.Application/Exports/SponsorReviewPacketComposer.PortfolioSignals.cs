using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Exports;

namespace ArchLucid.Application.Exports;

public static partial class SponsorReviewPacketComposer
{
    private static void AppendTopDecisionsSection(StringBuilder sb, IReadOnlyList<SponsorReviewPacketDecisionRow>? topDecisions)
    {
        if (topDecisions is null || topDecisions.Count == 0)
            return;

        sb.AppendLine("## Top decisions");
        sb.AppendLine();

        foreach (SponsorReviewPacketDecisionRow decision in topDecisions.Take(5))
        {
            sb.AppendLine($"- **{decision.Title.Trim()}** — {decision.SelectedOption.Trim()}");

            if (!string.IsNullOrWhiteSpace(decision.ConfidenceLabel))
                sb.AppendLine($"  - Confidence: {decision.ConfidenceLabel.Trim()}");

            if (!string.IsNullOrWhiteSpace(decision.EvidenceHref))
                sb.AppendLine($"  - Evidence: {decision.EvidenceHref.Trim()}");
        }

        sb.AppendLine();
    }

    private static void AppendPortfolioSignalsSection(StringBuilder sb, SponsorReviewPacketPortfolioSignals? portfolioSignals)
    {
        if (portfolioSignals is null)
            return;

        sb.AppendLine("## Portfolio signals (live)");
        sb.AppendLine();
        sb.AppendLine(
            $"- **Findings resolved (30d):** {portfolioSignals.ResolvedFindingsCount30Days.ToString(CultureInfo.InvariantCulture)}");
        sb.AppendLine(
            $"- **Findings discovered (30d):** {portfolioSignals.NewlyDiscoveredFindingsCount30Days.ToString(CultureInfo.InvariantCulture)}");
        sb.AppendLine(
            $"- **Stale architecture risks:** {portfolioSignals.StaleRiskCount.ToString(CultureInfo.InvariantCulture)}");
        sb.AppendLine(
            $"- **Waivers expiring (14d):** {portfolioSignals.ExpiringWaiversCount14Days.ToString(CultureInfo.InvariantCulture)}");

        if (portfolioSignals.NextActions.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("### Next actions");

            foreach (string action in portfolioSignals.NextActions.Take(5))
            {
                if (!string.IsNullOrWhiteSpace(action))
                    sb.AppendLine($"- {action.Trim()}");
            }
        }

        sb.AppendLine();
    }
}
