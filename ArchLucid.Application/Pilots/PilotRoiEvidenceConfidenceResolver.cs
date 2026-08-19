using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Derives <see cref="PilotRoiEvidenceConfidence"/> from persisted tenant value-window baseline posture (same inputs as
///     <see cref="RoiEvidenceCompletenessMarkdownFormatter"/>).
/// </summary>
public static class PilotRoiEvidenceConfidenceResolver
{
    public static PilotRoiEvidenceConfidence Resolve(ValueReportSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        return snapshot.ReviewCycleBaselineProvenance switch
        {
            ReviewCycleBaselineProvenance.TenantSuppliedAtSignup or ReviewCycleBaselineProvenance.TenantSuppliedViaSettings =>
                PilotRoiEvidenceConfidence.Strong,
            ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions => PilotRoiEvidenceConfidence.Partial,
            ReviewCycleBaselineProvenance.NoMeasurementYet or _ => PilotRoiEvidenceConfidence.Low,
        };
    }

    /// <summary>Long-form label for Markdown tables (baseline capture channel).</summary>
    public static string FormatBaselineProvenanceLabel(ReviewCycleBaselineProvenance provenance)
    {
        return provenance switch
        {
            ReviewCycleBaselineProvenance.TenantSuppliedAtSignup => "Tenant-supplied baseline captured at signup",
            ReviewCycleBaselineProvenance.TenantSuppliedViaSettings => "Tenant-supplied baseline from pilot settings",
            ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions => "Defaulted from ROI model options",
            ReviewCycleBaselineProvenance.NoMeasurementYet => "No measurement yet",
            _ => "Baseline posture unknown",
        };
    }
}
