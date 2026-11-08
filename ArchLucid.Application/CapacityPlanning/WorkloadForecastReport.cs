using System.Text.Json;

namespace ArchLucid.Application.CapacityPlanning;

/// <summary>Advisory, deterministic comparison records. Never hard-gates a build.</summary>
public static class WorkloadForecastReport
{
    public sealed record Sample(string Revision, string Workload, string Metric,
        string Unit, decimal Forecast, decimal Observed);
    public sealed record Row(string Revision, string Workload, string Metric, string Unit,
        decimal Forecast, decimal Observed, decimal AbsoluteError,
        decimal? AbsolutePercentageError, bool AdvisoryExceeded);
    public sealed record Report(int SchemaVersion, string EvidenceStatus, IReadOnlyList<Row> Rows);

    public static Report Build(IReadOnlyCollection<Sample> samples, decimal advisoryThresholdPercent)
    {
        ArgumentNullException.ThrowIfNull(samples);
        if (samples.Count > 10000 || advisoryThresholdPercent < 0)
            throw new ArgumentOutOfRangeException(nameof(samples));
        List<Row> rows = new();
        foreach (Sample s in samples.OrderBy(x => x.Revision, StringComparer.Ordinal)
                     .ThenBy(x => x.Workload, StringComparer.Ordinal)
                     .ThenBy(x => x.Metric, StringComparer.Ordinal))
        {
            if (string.IsNullOrWhiteSpace(s.Revision) || string.IsNullOrWhiteSpace(s.Workload) ||
                string.IsNullOrWhiteSpace(s.Metric) || string.IsNullOrWhiteSpace(s.Unit))
                throw new ArgumentException("Every sample requires revision, workload, metric and unit.", nameof(samples));
            var error = WorkloadForecastAccuracy.Compare(s.Forecast, s.Observed, advisoryThresholdPercent);
            rows.Add(new(s.Revision, s.Workload, s.Metric, s.Unit, s.Forecast, s.Observed,
                error.AbsoluteError, error.AbsolutePercentageError, error.ThresholdExceeded));
        }
        return new(1, rows.Count == 0 ? "NO_OBSERVATIONS" : "OBSERVED_COMPARISONS_ADVISORY", rows);
    }

    public static string ToJson(Report report) =>
        JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true });

    public static string ToMarkdown(Report report)
    {
        ArgumentNullException.ThrowIfNull(report);
        List<string> lines = ["# ArchLucid capacity forecast accuracy", "",
            "Advisory comparisons; not evidence of overall forecast calibration.", "",
            "| Revision | Workload | Metric | Unit | Forecast | Observed | Absolute error | Percentage error | Advisory |",
            "|---|---|---|---|---:|---:|---:|---:|---|"];
        foreach (Row row in report.Rows)
        {
            static string Safe(string value) => value.Replace("|", "\\|").Replace("\r", " ").Replace("\n", " ");
            lines.Add($"| {Safe(row.Revision)} | {Safe(row.Workload)} | {Safe(row.Metric)} | {Safe(row.Unit)} | {row.Forecast} | {row.Observed} | {row.AbsoluteError} | {row.AbsolutePercentageError?.ToString() ?? "n/a"} | {(row.AdvisoryExceeded ? "Review" : "No flag")} |");
        }
        return string.Join("\n", lines) + "\n";
    }
}
