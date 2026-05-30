namespace ArchLucid.Contracts.Roi;

/// <summary>
///     Source classification for sponsor-facing ROI and cost lines (assessment improvement #3).
/// </summary>
public enum RoiMetricSourceKind
{
    CustomerProvided = 0,

    ExtractorZip = 1,

    RetailPriceRow = 2,

    BenchmarkAssumption = 3,

    NotEstimated = 4,
}
