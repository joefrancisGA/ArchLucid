using System.Text.Json;

namespace ArchLucid.Application.CapacityPlanning;

/// <summary>
/// Read-only rolling forecast history assembled from externally supplied, matched observations.
/// Does not fetch telemetry or store tenant identifiers.
/// </summary>
public static class WorkloadForecastHistory
{
    public sealed record Observation(int SchemaVersion, string Revision, string Workload,
        string Metric, string Unit, decimal Forecast, decimal Actual, DateTimeOffset RecordedAtUtc);
    public sealed record Series(string Workload, string Metric, string Unit,
        int Observations, decimal MeanAbsoluteError, decimal? MeanAbsolutePercentageError,
        decimal? LatestAbsolutePercentageError, string EvidenceStatus);

    public static IReadOnlyList<Observation> Import(string json)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(json);
        if (json.Length > 1_000_000) throw new ArgumentOutOfRangeException(nameof(json));
        Observation[] observations = JsonSerializer.Deserialize<Observation[]>(json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true, MaxDepth = 12,
                UnmappedMemberHandling = System.Text.Json.Serialization.JsonUnmappedMemberHandling.Disallow })
            ?? throw new ArgumentException("Missing history entries.", nameof(json));
        if (observations.Length > 10000) throw new ArgumentOutOfRangeException(nameof(json));
        foreach (Observation o in observations)
        {
            if (o.SchemaVersion != 1 || string.IsNullOrWhiteSpace(o.Revision) ||
                string.IsNullOrWhiteSpace(o.Workload) || string.IsNullOrWhiteSpace(o.Metric) ||
                string.IsNullOrWhiteSpace(o.Unit) || o.Forecast < 0 || o.Actual < 0 ||
                o.RecordedAtUtc == default || o.RecordedAtUtc.Offset != TimeSpan.Zero)
                throw new ArgumentException("Invalid versioned forecast observation.", nameof(json));
        }
        return observations;
    }

    public static IReadOnlyList<Series> Summarize(IReadOnlyCollection<Observation> observations)
    {
        ArgumentNullException.ThrowIfNull(observations);
        if (observations.Count > 10000) throw new ArgumentOutOfRangeException(nameof(observations));
        return observations.GroupBy(o => (o.Workload, o.Metric, o.Unit))
            .OrderBy(g => g.Key.Workload, StringComparer.Ordinal)
            .ThenBy(g => g.Key.Metric, StringComparer.Ordinal)
            .ThenBy(g => g.Key.Unit, StringComparer.Ordinal)
            .Select(g =>
            {
                Observation[] ordered = g.OrderBy(o => o.RecordedAtUtc).ThenBy(o => o.Revision, StringComparer.Ordinal).ToArray();
                WorkloadForecastAccuracy.Error[] errors = ordered.Select(o =>
                    WorkloadForecastAccuracy.Compare(o.Forecast, o.Actual)).ToArray();
                decimal[] defined = errors.Where(e => e.AbsolutePercentageError.HasValue)
                    .Select(e => e.AbsolutePercentageError!.Value).ToArray();
                return new Series(g.Key.Workload, g.Key.Metric, g.Key.Unit, ordered.Length,
                    errors.Average(e => e.AbsoluteError),
                    defined.Length == 0 ? null : defined.Average(),
                    errors[^1].AbsolutePercentageError,
                    "HISTORICAL_OBSERVATIONS_NOT_STATISTICAL_CONFIDENCE");
            }).ToArray();
    }
}
