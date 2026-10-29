using System.Text.Json;

namespace ArchLucid.Application.CapacityPlanning;

/// <summary>
/// Converts trusted, already-aggregated metric deltas into schema-v1 forecast observations.
/// Do not supply cumulative counters directly or tenant-labelled rows.
/// </summary>
public static class WorkloadTelemetryObservationExport
{
    public sealed record Aggregate(string MetricName, string Unit, decimal IntervalValue,
        DateTimeOffset WindowEndUtc, string MeasurementScope);
    public sealed record Forecast(string Revision, string Workload, string MetricName,
        string Unit, decimal PredictedValue);
    public sealed record ExportResult(string Status, string? Json);

    private static readonly IReadOnlyDictionary<string, string> Allowed = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        ["archlucid_llm_prompt_tokens_total"] = "tokens",
        ["archlucid_llm_completion_tokens_total"] = "tokens",
        ["archlucid_llm_embedding_input_tokens_total"] = "tokens",
        ["archlucid_container_job_runs_total"] = "runs"
    };

    public static ExportResult Export(Aggregate measurement, Forecast forecast)
    {
        ArgumentNullException.ThrowIfNull(measurement);
        ArgumentNullException.ThrowIfNull(forecast);
        if (!Allowed.TryGetValue(measurement.MetricName, out string? expectedUnit) ||
            measurement.Unit != expectedUnit || forecast.MetricName != measurement.MetricName ||
            forecast.Unit != expectedUnit || measurement.MeasurementScope != "AGGREGATE_INTERVAL_DELTA")
            return new("INCOMPATIBLE_METRIC_OR_SCOPE", null);
        if (string.IsNullOrWhiteSpace(forecast.Revision) ||
            string.IsNullOrWhiteSpace(forecast.Workload) || measurement.IntervalValue < 0 ||
            forecast.PredictedValue < 0 || measurement.WindowEndUtc == default ||
            measurement.WindowEndUtc.Offset != TimeSpan.Zero)
            return new("INVALID_OBSERVATION", null);
        var observation = new WorkloadForecastHistory.Observation(1, forecast.Revision,
            forecast.Workload, measurement.MetricName, expectedUnit, forecast.PredictedValue,
            measurement.IntervalValue, measurement.WindowEndUtc);
        return new("AGGREGATED_INTERVAL_METRIC_NOT_ISOLATED_CPU", JsonSerializer.Serialize(new[] { observation }));
    }
}
