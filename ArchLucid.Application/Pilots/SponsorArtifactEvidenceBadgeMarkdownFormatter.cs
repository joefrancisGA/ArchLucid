using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Sponsor-facing evidence source and freshness badges for first-value and executive exports — labeling only, no
///     pricing math changes.
/// </summary>
public static class SponsorArtifactEvidenceBadgeMarkdownFormatter
{
    public static void AppendMarkdownSection(
        StringBuilder sb,
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse proof,
        ValueReportSnapshot snapshot,
        string savingsPricingBasis,
        string costEvidenceFreshnessStatus)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(proof);
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(savingsPricingBasis);
        ArgumentNullException.ThrowIfNull(costEvidenceFreshnessStatus);

        SponsorArtifactEvidenceBadgeSummary badges = Resolve(
            deltas,
            proof,
            snapshot,
            savingsPricingBasis,
            costEvidenceFreshnessStatus);

        sb.AppendLine("## Sponsor artifact evidence badges");
        sb.AppendLine();
        sb.AppendLine(
            "**Purpose:** Executives must see whether cost/ROI proof is current, demo-derived, buyer-provided, or missing before circulation.");
        sb.AppendLine();
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"- **Evidence source:** **{badges.SourceLabel}** (`{badges.SourceToken}`)");
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"- **Evidence freshness:** **{badges.FreshnessLabel}** (`{badges.FreshnessToken}`)");

        if (badges.WarnBeforeSponsorSend)
        {
            sb.AppendLine();
            sb.AppendLine(
                "> **HOLD posture:** Stale, missing, demo-derived, or heuristic-only evidence must **not** be presented as current customer proof.");
        }

        sb.AppendLine();
    }

    internal static SponsorArtifactEvidenceBadgeSummary Resolve(
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse proof,
        ValueReportSnapshot snapshot,
        string savingsPricingBasis,
        string costEvidenceFreshnessStatus)
    {
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(proof);
        ArgumentNullException.ThrowIfNull(snapshot);

        string sourceToken = ResolveSourceToken(deltas, proof, snapshot, savingsPricingBasis);
        string freshnessToken = ResolveFreshnessToken(costEvidenceFreshnessStatus);
        bool warn = sourceToken is "demo-derived" or "missing" or "heuristic-fallback"
            || freshnessToken is "stale" or "missing" or "not-collected";

        return new SponsorArtifactEvidenceBadgeSummary(
            SourceToken: sourceToken,
            SourceLabel: DescribeSource(sourceToken),
            FreshnessToken: freshnessToken,
            FreshnessLabel: DescribeFreshness(freshnessToken),
            WarnBeforeSponsorSend: warn);
    }

    private static string ResolveSourceToken(
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse proof,
        ValueReportSnapshot snapshot,
        string savingsPricingBasis)
    {
        if (deltas.IsDemoTenant || proof.DemoTenantWarningRequired)
            return "demo-derived";

        if (string.Equals(savingsPricingBasis, ExecutiveRoiSavingsPricingBasis.UploadedActualAmortized, StringComparison.Ordinal))
            return "uploaded-actual-amortized";

        if (string.Equals(savingsPricingBasis, ExecutiveRoiSavingsPricingBasis.HeuristicFallback, StringComparison.Ordinal))
            return "heuristic-fallback";

        if (snapshot.ReviewCycleBaselineProvenance is ReviewCycleBaselineProvenance.TenantSuppliedAtSignup
            or ReviewCycleBaselineProvenance.TenantSuppliedViaSettings)
            return "buyer-provided";

        if (proof.RoiEvidenceConfidence is PilotRoiEvidenceConfidence.Strong
            && !string.IsNullOrWhiteSpace(proof.RoiConfidenceLabel))
            return "buyer-provided";

        if (string.Equals(savingsPricingBasis, ExecutiveRoiSavingsPricingBasis.Retail, StringComparison.Ordinal)
            || string.Equals(savingsPricingBasis, ExecutiveRoiSavingsPricingBasis.EaAdjusted, StringComparison.Ordinal))
            return "azure-retail";

        return "missing";
    }

    private static string ResolveFreshnessToken(string costEvidenceFreshnessStatus)
    {
        if (string.Equals(costEvidenceFreshnessStatus, RoiCostEvidenceFreshness.Fresh, StringComparison.OrdinalIgnoreCase))
            return "fresh";

        if (string.Equals(costEvidenceFreshnessStatus, RoiCostEvidenceFreshness.Stale, StringComparison.OrdinalIgnoreCase))
            return "stale";

        if (string.Equals(costEvidenceFreshnessStatus, RoiCostEvidenceFreshness.Missing, StringComparison.OrdinalIgnoreCase))
            return "missing";

        return "not-collected";
    }

    private static string DescribeSource(string token) => token switch
    {
        "buyer-provided" => "Buyer-provided baseline",
        "uploaded-actual-amortized" => "Uploaded actual/amortized",
        "azure-retail" => "Azure Retail catalog",
        "heuristic-fallback" => "Heuristic fallback",
        "demo-derived" => "Demo-derived",
        "missing" => "Missing evidence source",
        _ => token,
    };

    private static string DescribeFreshness(string token) => token switch
    {
        "fresh" => "Fresh",
        "stale" => "Stale",
        "missing" => "Missing",
        "not-collected" => "Not collected",
        _ => token,
    };
}

internal sealed record SponsorArtifactEvidenceBadgeSummary(
    string SourceToken,
    string SourceLabel,
    string FreshnessToken,
    string FreshnessLabel,
    bool WarnBeforeSponsorSend);
