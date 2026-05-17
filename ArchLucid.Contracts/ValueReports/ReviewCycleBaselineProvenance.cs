namespace ArchLucid.Contracts.ValueReports;

/// <summary>
///     Whether the review-cycle baseline in <see cref="ValueReportSnapshot" /> came from the tenant row or ROI
///     defaults.
/// </summary>
public enum ReviewCycleBaselineProvenance
{
    TenantSuppliedAtSignup,

    /// <summary>
    ///     When <c>dbo.Tenants.BaselineReviewCycleSource</c> uses reserved operator markers (<c>baseline_settings</c> or
    ///     <c>baseline_settings:</c> suffix notes).
    /// </summary>
    TenantSuppliedViaSettings,

    DefaultedFromRoiModelOptions,

    NoMeasurementYet
}
