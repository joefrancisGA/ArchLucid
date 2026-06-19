using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Maps persisted baseline posture to sponsor-safe ROI narrative disposition (PASS / WARN / HOLD).
/// </summary>
public static class SponsorRoiClaimDispositionResolver
{
    public static SponsorRoiClaimDispositionResult Resolve(
        ValueReportSnapshot snapshot,
        PilotRoiBaselineInputsStatusResponse? baselineInputs,
        bool isDemoTenant)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        PilotRoiEvidenceConfidence confidence = PilotRoiEvidenceConfidenceResolver.Resolve(snapshot);
        bool projectedDollarClaimsSponsorSafe = baselineInputs?.ProjectedDollarClaimsSponsorSafe == true;
        string basisClassSummary = FormatBasisClassSummary(baselineInputs, snapshot, isDemoTenant);
        SponsorRoiClaimDisposition disposition = ResolveDisposition(
            confidence,
            baselineInputs,
            isDemoTenant,
            projectedDollarClaimsSponsorSafe);

        return new SponsorRoiClaimDispositionResult(
            disposition,
            confidence,
            basisClassSummary,
            projectedDollarClaimsSponsorSafe,
            SponsorRoiClaimDispositionRules.DescribeLeadLine(disposition),
            BuildNarrativeBlock(disposition, projectedDollarClaimsSponsorSafe, basisClassSummary));
    }

    /// <summary>Conservative snapshot-only path for DOCX value reports without scorecard rows.</summary>
    public static SponsorRoiClaimDispositionResult ResolveFromSnapshotOnly(ValueReportSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        PilotRoiEvidenceConfidence confidence = PilotRoiEvidenceConfidenceResolver.Resolve(snapshot);
        SponsorRoiClaimDisposition disposition = confidence switch
        {
            PilotRoiEvidenceConfidence.Strong => SponsorRoiClaimDisposition.Warn,
            PilotRoiEvidenceConfidence.Partial => SponsorRoiClaimDisposition.Warn,
            PilotRoiEvidenceConfidence.Low or _ => SponsorRoiClaimDisposition.Hold,
        };

        string basisClassSummary = $"review-cycle baseline: {PilotRoiEvidenceConfidenceResolver.FormatBaselineProvenanceLabel(snapshot.ReviewCycleBaselineProvenance)}";

        return new SponsorRoiClaimDispositionResult(
            disposition,
            confidence,
            basisClassSummary,
            ProjectedDollarClaimsSponsorSafe: false,
            BuildDispositionLeadLine(disposition),
            BuildNarrativeBlock(disposition, projectedDollarClaimsSponsorSafe: false, basisClassSummary));
    }

    private static SponsorRoiClaimDisposition ResolveDisposition(
        PilotRoiEvidenceConfidence confidence,
        PilotRoiBaselineInputsStatusResponse? baselineInputs,
        bool isDemoTenant,
        bool projectedDollarClaimsSponsorSafe)
    {
        if (isDemoTenant)
            return SponsorRoiClaimDisposition.Hold;

        if (HasBasis(baselineInputs, PilotRoiBaselineInputBasis.DemoDerived))
            return SponsorRoiClaimDisposition.Hold;

        if (confidence is PilotRoiEvidenceConfidence.Low
            || HasBasis(baselineInputs, PilotRoiBaselineInputBasis.NotCollected))
            return SponsorRoiClaimDisposition.Hold;

        if (confidence is PilotRoiEvidenceConfidence.Partial
            || HasBasis(baselineInputs, PilotRoiBaselineInputBasis.Defaulted)
            || !projectedDollarClaimsSponsorSafe)
            return SponsorRoiClaimDisposition.Warn;

        return SponsorRoiClaimDisposition.Pass;
    }

    private static bool HasBasis(
        PilotRoiBaselineInputsStatusResponse? inputs,
        PilotRoiBaselineInputBasis basis)
    {
        return inputs is not null
            && (inputs.ReviewCycleHoursBasis == basis
            || inputs.ArchitectPrepHoursPerReviewBasis == basis
            || inputs.EvidenceAssemblyEffortBasis == basis
            || inputs.ArchitectHourlyCostBasis == basis);
    }

    private static string FormatBasisClassSummary(
        PilotRoiBaselineInputsStatusResponse? baselineInputs,
        ValueReportSnapshot snapshot,
        bool isDemoTenant)
    {
        if (isDemoTenant)
            return "demo-derived (all ROI baseline inputs)";

        if (baselineInputs is not null)
            return PilotRoiBaselineInputsStatusResolver.FormatInputsSummary(baselineInputs);

        return $"review-cycle baseline: {PilotRoiEvidenceConfidenceResolver.FormatBaselineProvenanceLabel(snapshot.ReviewCycleBaselineProvenance)}";
    }

    private static string BuildDispositionLeadLine(SponsorRoiClaimDisposition disposition)
        => SponsorRoiClaimDispositionRules.DescribeLeadLine(disposition);

    private static string BuildNarrativeBlock(
        SponsorRoiClaimDisposition disposition,
        bool projectedDollarClaimsSponsorSafe,
        string basisClassSummary)
    {
        string projectedLine = projectedDollarClaimsSponsorSafe
            ? "Projected dollar claims: **sponsor-safe** when paired with human redaction."
            : "Projected dollar claims: **not sponsor-safe** — qualitative or estimate wording only.";

        return disposition switch
        {
            SponsorRoiClaimDisposition.Pass =>
                $"{projectedLine} Basis class: {basisClassSummary}.",
            SponsorRoiClaimDisposition.Warn =>
                $"{projectedLine} Basis class: {basisClassSummary}. Comparative percentages and annualized dollars are directional planning figures — not customer-specific outcomes.",
            SponsorRoiClaimDisposition.Hold =>
                $"{projectedLine} Basis class: {basisClassSummary}. Do not quote hours-saved percentages, annualized ROI, or USD savings in sponsor materials.",
            _ => throw new ArgumentOutOfRangeException(nameof(disposition), disposition, null),
        };
    }
}
