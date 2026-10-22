namespace ArchLucid.Contracts.Roi;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

/// <summary>
///     Source classification for sponsor-facing ROI and cost lines (assessment improvement #3).
/// </summary>
[JsonConverter(typeof(DefinedEnumJsonConverter<RoiMetricSourceKind>))]
public enum RoiMetricSourceKind
{
    CustomerProvided = 0,

    ExtractorZip = 1,

    RetailPriceRow = 2,

    BenchmarkAssumption = 3,

    NotEstimated = 4,
}
