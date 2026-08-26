using System.Globalization;
using System.Text;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Application.Exports;

/// <summary>Composes a sponsor-facing sponsor review packet from run detail and ROI rollup inputs.</summary>
public static class SponsorReviewPacketComposer
{
    /// <summary>Builds deterministic Markdown for sponsor review exports (no LLM calls).</summary>
    public static string ComposeMarkdown(
        ArchitectureRunDetail detail,
        string SponsorReport,
        IReadOnlyList<string> topFindingTitles,
        SponsorRoiSummaryResponse roiSummary,
        DateTime generatedUtc,
        IReadOnlyList<SponsorReviewPacketDecisionRow>? topDecisions = null,
        SponsorReviewPacketPortfolioSignals? portfolioSignals = null,
        string? activeTrialExportNotice = null)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(SponsorReport);
        ArgumentNullException.ThrowIfNull(topFindingTitles);
        ArgumentNullException.ThrowIfNull(roiSummary);

        StringBuilder sb = new();

        sb.AppendLine("# Sponsor review packet");
        sb.AppendLine();
        sb.AppendLine($"**Generated (UTC):** {generatedUtc:yyyy-MM-dd HH:mm:ss} Z");

        ExportSafetyNoticeMarkdown.Append(sb, isDemoTenant: false, activeTrialExportNotice);
        sb.AppendLine();
        AppendManifestSummarySection(sb, detail);

        if (detail.Run is not null)
            SponsorExecutionModeMarkdownFormatter.AppendMarkdownSection(sb, detail.Run);

        AppendTopDecisionsSection(sb, topDecisions);
        AppendRunSummarySection(sb, detail, SponsorReport, topFindingTitles);
        AppendPortfolioSignalsSection(sb, portfolioSignals);
        AppendRoiBasisSection(sb, roiSummary);
        AppendSponsorArtifactEvidenceBadgeSection(sb, roiSummary, detail);
        AppendDispositionRoiBasisSection(sb, roiSummary);
        AppendRealizedValueSection(sb, roiSummary);

        return sb.ToString().TrimEnd() + Environment.NewLine;
    }

    private static void AppendSponsorArtifactEvidenceBadgeSection(
        StringBuilder sb,
        SponsorRoiSummaryResponse roiSummary,
        ArchitectureRunDetail detail)
    {
        bool isDemoTenant = ContosoRetailDemoIdentifiers.IsDemoRunId(detail.Run?.RunId ?? string.Empty)
            || ContosoRetailDemoIdentifiers.IsDemoRequestId(detail.Run?.RequestId);

        PilotRunDeltas deltas = new() { IsDemoTenant = isDemoTenant };

        SponsorArtifactEvidenceBadgeSummary badges = SponsorArtifactEvidenceBadgeMarkdownFormatter.Resolve(
            deltas,
            new ProofPackageCompletenessResponse(),
            CreateEmptyValueReportSnapshot(),
            roiSummary.SavingsPricingBasis,
            roiSummary.CostEvidenceFreshnessStatus);

        sb.AppendLine();
        sb.AppendLine("## Sponsor artifact evidence badges");
        sb.AppendLine();
        sb.AppendLine(
            $"- **Evidence source:** **{badges.SourceLabel}** (`{badges.SourceToken}`)");
        sb.AppendLine(
            $"- **Evidence freshness:** **{badges.FreshnessLabel}** (`{badges.FreshnessToken}`)");

        if (badges.WarnBeforeSponsorSend)
        {
            sb.AppendLine();
            sb.AppendLine(
                "> **HOLD posture:** Stale, missing, demo-derived, or heuristic-only evidence must **not** be presented as current customer proof.");
        }
    }

    private static ValueReportSnapshot CreateEmptyValueReportSnapshot()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        return new ValueReportSnapshot(
            TenantId: tenantId,
            WorkspaceId: workspaceId,
            ProjectId: projectId,
            PeriodFromUtc: DateTimeOffset.MinValue,
            PeriodToUtc: DateTimeOffset.MinValue,
            RunStatusRows: [],
            RunsCompletedCount: 0,
            ManifestsCommittedCount: 0,
            GovernanceEventsHandledCount: 0,
            DriftAlertEventsCaughtCount: 0,
            EstimatedArchitectHoursSavedFromManifests: 0m,
            EstimatedArchitectHoursSavedFromGovernanceEvents: 0m,
            EstimatedArchitectHoursSavedFromDriftEvents: 0m,
            EstimatedTotalArchitectHoursSaved: 0m,
            EstimatedLlmCostForWindowUsd: 0m,
            EstimatedLlmCostMethodologyNote: "",
            AnnualizedHoursValueUsd: 0m,
            AnnualizedLlmCostUsd: 0m,
            BaselineAnnualSubscriptionAndOpsCostUsdFromRoiModel: 0m,
            NetAnnualizedValueVersusRoiBaselineUsd: 0m,
            RoiAnnualizedPercentVersusRoiBaseline: 0m,
            TenantBaselineReviewCycleHours: 0m,
            TenantBaselineReviewCycleSource: null,
            TenantBaselineReviewCycleCapturedUtc: null,
            MeasuredAverageReviewCycleHoursForWindow: null,
            MeasuredReviewCycleSampleSize: 0,
            ReviewCycleBaselineProvenance: ReviewCycleBaselineProvenance.NoMeasurementYet,
            ReviewCycleHoursDelta: null,
            ReviewCycleHoursDeltaPercent: null,
            FindingFeedbackNetScore: 0,
            FindingFeedbackVoteCount: 0,
            TenantBaselineManualPrepHoursPerReview: null,
            TenantBaselinePeoplePerReview: null);
    }

    private static void AppendDispositionRoiBasisSection(StringBuilder sb, SponsorRoiSummaryResponse roiSummary)
    {
        SponsorRoiBasisBreakdown? basis = roiSummary.BasisBreakdown;

        if (basis is null)
            return;

        sb.AppendLine();
        sb.AppendLine("## ROI basis by disposition");
        sb.AppendLine();
        sb.AppendLine($"**Cost basis:** {SponsorRoiBasisBreakdown.CostBasisLabel} (not invoiced Azure cost)");
        sb.AppendLine(
            $"- **Open (estimated potential):** {basis.OpenEstimatedUsd.ToString("N2", CultureInfo.InvariantCulture)} USD");
        sb.AppendLine(
            $"- **Needs evidence:** {basis.NeedsEvidenceUsd.ToString("N2", CultureInfo.InvariantCulture)} USD");
        sb.AppendLine(
            $"- **Accepted risk:** {basis.AcceptedRiskUsd.ToString("N2", CultureInfo.InvariantCulture)} USD");
        sb.AppendLine(
            $"- **Deferred:** {basis.DeferredUsd.ToString("N2", CultureInfo.InvariantCulture)} USD");
        sb.AppendLine(
            $"- **Waived:** {basis.WaivedUsd.ToString("N2", CultureInfo.InvariantCulture)} USD");
        sb.AppendLine(
            $"- **Realized (remediated):** {basis.RealizedUsd.ToString("N2", CultureInfo.InvariantCulture)} USD");
        sb.AppendLine(
            $"- **Rejected (not applicable):** {basis.RejectedNotApplicableUsd.ToString("N2", CultureInfo.InvariantCulture)} USD");
    }

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

    private static void AppendManifestSummarySection(StringBuilder sb, ArchitectureRunDetail detail)
    {
        GoldenManifest? manifest = detail.Manifest;

        if (manifest is null)
            return;

        ArchitectureRun? run = detail.Run;
        string manifestVersion = manifest.Metadata?.ManifestVersion ?? "—";
        string runId = run?.RunId ?? "—";
        string statusLabel = run?.Status.ToString() ?? "—";

        sb.AppendLine("## Manifest summary");
        sb.AppendLine();
        sb.AppendLine($"- **System:** {manifest.SystemName}");
        sb.AppendLine($"- **Manifest version:** {manifestVersion}");
        sb.AppendLine($"- **Review ID:** `{runId}`");
        sb.AppendLine($"- **Status:** {statusLabel}");
        sb.AppendLine();
    }

    private static void AppendRunSummarySection(
        StringBuilder sb,
        ArchitectureRunDetail detail,
        string SponsorReport,
        IReadOnlyList<string> topFindingTitles)
    {
        RunSummaryOnePagerDocumentModel onePager =
            RunSummaryOnePagerDocumentFactory.Create(detail, SponsorReport, topFindingTitles);

        sb.AppendLine("## Review summary");
        sb.AppendLine();
        sb.AppendLine(RunSummaryOnePagerMarkdownRenderer.Render(onePager).TrimEnd());
        sb.AppendLine();
    }

    private static void AppendRoiBasisSection(StringBuilder sb, SponsorRoiSummaryResponse roiSummary)
    {
        SponsorRoiClaimDisposition disposition = SponsorRoiPacketDispositionResolver.Resolve(roiSummary);

        sb.AppendLine("## ROI basis");
        sb.AppendLine();
        sb.AppendLine($"**ROI claim disposition:** {SponsorRoiClaimDispositionRules.DescribeLeadLine(disposition)}");
        sb.AppendLine();
        sb.AppendLine($"**Savings pricing basis:** {roiSummary.SavingsPricingBasis}");
        sb.AppendLine(
            $"**EA discount multiplier:** {roiSummary.EaDiscountMultiplier.ToString("0.####", CultureInfo.InvariantCulture)}");

        if (!string.IsNullOrWhiteSpace(roiSummary.SavingsPricingBasisDescription))
            sb.AppendLine($"**Pricing basis note:** {roiSummary.SavingsPricingBasisDescription.Trim()}");

        if (!string.IsNullOrWhiteSpace(roiSummary.CostEvidenceFreshnessStatus))
        {
            sb.AppendLine(
                $"**Cost evidence freshness:** {roiSummary.CostEvidenceFreshnessStatus} (stale after {roiSummary.CostEvidenceStaleAfterDays.ToString(CultureInfo.InvariantCulture)} days)");
        }

        string savingsQualifier = disposition switch
        {
            SponsorRoiClaimDisposition.Pass => "sponsor-quotable after human redaction",
            SponsorRoiClaimDisposition.Warn => "estimate-basis — not a customer-specific savings attestation",
            SponsorRoiClaimDisposition.Hold => "internal planning only — do not circulate projected savings externally",
            _ => throw new ArgumentOutOfRangeException(nameof(disposition), disposition, null),
        };

        sb.AppendLine(
            $"**Estimated savings (USD):** {roiSummary.TotalEstimatedUsdSavings.ToString("N2", CultureInfo.InvariantCulture)} ({savingsQualifier})");
    }

    private static void AppendRealizedValueSection(StringBuilder sb, SponsorRoiSummaryResponse roiSummary)
    {
        RealizedValueSummary? realized = roiSummary.RealizedValue;

        if (realized is null)
            return;

        sb.AppendLine();
        sb.AppendLine("## Realized value (computed)");
        sb.AppendLine();
        sb.AppendLine(
            $"- **Findings remediated (30d):** {realized.FindingsRemediatedCount30Days.ToString(CultureInfo.InvariantCulture)}");

        if (realized.MedianTimeToRemediationDays is not null)
        {
            sb.AppendLine(
                $"- **Median time to remediation (days):** {realized.MedianTimeToRemediationDays.Value.ToString("0.#", CultureInfo.InvariantCulture)}");
        }

        sb.AppendLine(
            $"- **Active waivers:** {realized.ActiveWaiversCount.ToString(CultureInfo.InvariantCulture)}");
        sb.AppendLine(
            $"- **Waivers retired (30d):** {realized.WaiversRetiredCount30Days.ToString(CultureInfo.InvariantCulture)}");
        sb.AppendLine(
            $"- **Waiver expiry reversions (30d):** {realized.WaiverExpiryReversionCount30Days.ToString(CultureInfo.InvariantCulture)}");
    }
}
