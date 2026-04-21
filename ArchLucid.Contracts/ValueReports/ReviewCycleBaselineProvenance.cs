namespace ArchLucid.Contracts.ValueReports;

/// <summary>Whether the review-cycle baseline in <see cref="ValueReportSnapshot"/> came from the tenant row or ROI defaults.</summary>
public enum ReviewCycleBaselineProvenance
{
    TenantSuppliedAtSignup,

    DefaultedFromRoiModelOptions,

    NoMeasurementYet,
}
