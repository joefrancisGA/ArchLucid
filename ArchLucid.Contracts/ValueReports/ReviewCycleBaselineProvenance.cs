namespace ArchLucid.Contracts.ValueReports;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

/// <summary>
///     Whether the review-cycle baseline in <see cref="ValueReportSnapshot" /> came from the tenant row or ROI
///     defaults.
/// </summary>
[JsonConverter(typeof(DefinedEnumJsonConverter<ReviewCycleBaselineProvenance>))]
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
