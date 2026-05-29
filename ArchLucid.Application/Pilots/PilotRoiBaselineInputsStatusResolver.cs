using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Persistence.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Derives per-input ROI baseline basis labels from persisted tenant and scorecard rows.</summary>
public static class PilotRoiBaselineInputsStatusResolver
{
    public static PilotRoiBaselineInputsStatusResponse Resolve(
        ValueReportSnapshot snapshot,
        PilotRunDeltas deltas,
        PilotBaselineRecord? scorecardBaselines)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(deltas);

        if (deltas.IsDemoTenant)
        {
            return new PilotRoiBaselineInputsStatusResponse
            {
                ReviewCycleHoursBasis = PilotRoiBaselineInputBasis.DemoDerived,
                ArchitectPrepHoursPerReviewBasis = PilotRoiBaselineInputBasis.DemoDerived,
                EvidenceAssemblyEffortBasis = PilotRoiBaselineInputBasis.DemoDerived,
                ArchitectHourlyCostBasis = PilotRoiBaselineInputBasis.DemoDerived,
                ProjectedDollarClaimsSponsorSafe = false,
                SponsorSafeFallbackCopy =
                    "Demo-derived baselines — do not quote customer-specific hours, cadence, rates, or projected dollar savings externally.",
            };
        }

        PilotRoiBaselineInputBasis reviewCycle = MapReviewCycleHours(snapshot.ReviewCycleBaselineProvenance);
        PilotRoiBaselineInputBasis prepHours = MapArchitectPrepHours(snapshot.TenantBaselineManualPrepHoursPerReview);
        PilotRoiBaselineInputBasis assembly = MapEvidenceAssembly(scorecardBaselines?.BaselineReviewsPerQuarter);
        PilotRoiBaselineInputBasis hourlyCost = MapArchitectHourlyCost(scorecardBaselines?.BaselineArchitectHourlyCost);
        bool sponsorSafe = reviewCycle is PilotRoiBaselineInputBasis.BuyerProvided
            && prepHours is PilotRoiBaselineInputBasis.BuyerProvided
            && assembly is PilotRoiBaselineInputBasis.BuyerProvided
            && hourlyCost is PilotRoiBaselineInputBasis.BuyerProvided;

        return new PilotRoiBaselineInputsStatusResponse
        {
            ReviewCycleHoursBasis = reviewCycle,
            ArchitectPrepHoursPerReviewBasis = prepHours,
            EvidenceAssemblyEffortBasis = assembly,
            ArchitectHourlyCostBasis = hourlyCost,
            ProjectedDollarClaimsSponsorSafe = sponsorSafe,
            SponsorSafeFallbackCopy = BuildSponsorSafeFallbackCopy(reviewCycle, prepHours, assembly, hourlyCost),
        };
    }

    public static string FormatBasisLabel(PilotRoiBaselineInputBasis basis)
    {
        return basis switch
        {
            PilotRoiBaselineInputBasis.BuyerProvided => "buyer-provided",
            PilotRoiBaselineInputBasis.Defaulted => "defaulted",
            PilotRoiBaselineInputBasis.DemoDerived => "demo-derived",
            PilotRoiBaselineInputBasis.NotCollected => "not collected",
            _ => "not collected",
        };
    }

    public static string FormatInputsSummary(PilotRoiBaselineInputsStatusResponse inputs)
    {
        ArgumentNullException.ThrowIfNull(inputs);

        return string.Join(
            "; ",
            [
                $"review-cycle hours: {FormatBasisLabel(inputs.ReviewCycleHoursBasis)}",
                $"architect prep hours/review: {FormatBasisLabel(inputs.ArchitectPrepHoursPerReviewBasis)}",
                $"evidence assembly cadence (reviews/quarter): {FormatBasisLabel(inputs.EvidenceAssemblyEffortBasis)}",
                $"loaded architect hourly cost: {FormatBasisLabel(inputs.ArchitectHourlyCostBasis)}",
            ]);
    }

    private static PilotRoiBaselineInputBasis MapReviewCycleHours(ReviewCycleBaselineProvenance provenance)
    {
        return provenance switch
        {
            ReviewCycleBaselineProvenance.TenantSuppliedAtSignup or ReviewCycleBaselineProvenance.TenantSuppliedViaSettings =>
                PilotRoiBaselineInputBasis.BuyerProvided,
            ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions => PilotRoiBaselineInputBasis.Defaulted,
            ReviewCycleBaselineProvenance.NoMeasurementYet or _ => PilotRoiBaselineInputBasis.NotCollected,
        };
    }

    private static PilotRoiBaselineInputBasis MapArchitectPrepHours(decimal? manualPrepHoursPerReview)
    {
        if (manualPrepHoursPerReview is > 0m)
            return PilotRoiBaselineInputBasis.BuyerProvided;

        return PilotRoiBaselineInputBasis.NotCollected;
    }

    private static PilotRoiBaselineInputBasis MapEvidenceAssembly(int? baselineReviewsPerQuarter)
    {
        if (baselineReviewsPerQuarter is > 0)
            return PilotRoiBaselineInputBasis.BuyerProvided;

        return PilotRoiBaselineInputBasis.NotCollected;
    }

    private static PilotRoiBaselineInputBasis MapArchitectHourlyCost(decimal? baselineArchitectHourlyCost)
    {
        if (baselineArchitectHourlyCost is > 0m)
            return PilotRoiBaselineInputBasis.BuyerProvided;

        return PilotRoiBaselineInputBasis.NotCollected;
    }

    private static string BuildSponsorSafeFallbackCopy(
        PilotRoiBaselineInputBasis reviewCycle,
        PilotRoiBaselineInputBasis prepHours,
        PilotRoiBaselineInputBasis assembly,
        PilotRoiBaselineInputBasis hourlyCost)
    {
        if (reviewCycle is PilotRoiBaselineInputBasis.BuyerProvided
            && prepHours is PilotRoiBaselineInputBasis.BuyerProvided
            && assembly is PilotRoiBaselineInputBasis.BuyerProvided
            && hourlyCost is PilotRoiBaselineInputBasis.BuyerProvided)
        {
            return "All minimum ROI baseline inputs are buyer-provided — projected dollar lines may still require human redaction before external send.";
        }

        List<string> gaps = [];

        if (reviewCycle is not PilotRoiBaselineInputBasis.BuyerProvided)
            gaps.Add($"review-cycle hours ({FormatBasisLabel(reviewCycle)})");

        if (prepHours is not PilotRoiBaselineInputBasis.BuyerProvided)
            gaps.Add($"architect prep hours/review ({FormatBasisLabel(prepHours)})");

        if (assembly is not PilotRoiBaselineInputBasis.BuyerProvided)
            gaps.Add($"evidence assembly cadence ({FormatBasisLabel(assembly)})");

        if (hourlyCost is not PilotRoiBaselineInputBasis.BuyerProvided)
            gaps.Add($"loaded architect hourly cost ({FormatBasisLabel(hourlyCost)})");

        return "Do not lead sponsor readouts with projected dollar savings until these inputs are buyer-provided: "
            + string.Join(", ", gaps)
            + ". Use qualitative deltas and explicit estimate labels meanwhile.";
    }
}
