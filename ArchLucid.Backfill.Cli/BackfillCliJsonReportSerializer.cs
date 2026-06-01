using System.Text.Json;

using ArchLucid.Persistence.Coordination.Backfill;

namespace ArchLucid.Backfill.Cli;

/// <summary>Machine-readable Backfill.Cli report JSON (TB-090).</summary>
public static class BackfillCliJsonReportSerializer
{
    public const string SchemaVersion = "archlucid.backfill.cli.report.v1";

    private static readonly JsonSerializerOptions IndentedOptions = new() { WriteIndented = true };

    public static string SerializeBackfillReport(SqlRelationalBackfillReport report, long totalElapsedMs)
    {
        ArgumentNullException.ThrowIfNull(report);

        object payload = new
        {
            schema = SchemaVersion,
            mode = "backfill",
            generatedUtc = DateTimeOffset.UtcNow.ToString("O"),
            elapsedMs = totalElapsedMs,
            disposition = report.FailureCount > 0 ? "HOLD" : "PASS",
            processedCount = report.ProcessedCount,
            successCount = report.SuccessCount,
            failureCount = report.FailureCount,
            stages = report.StageTimings.Select(
                static t => new
                {
                    t.Stage,
                    t.ElapsedMilliseconds,
                    t.ProcessedCount,
                    t.SuccessCount,
                    t.FailureCount,
                }).ToArray(),
            failures = report.Failures.Select(static f => new { f.Stage, f.EntityKey, f.Message }).ToArray(),
        };

        return JsonSerializer.Serialize(payload, IndentedOptions);
    }

    public static string SerializeReadinessReport(CutoverReadinessReport report, long totalElapsedMs)
    {
        ArgumentNullException.ThrowIfNull(report);

        object payload = new
        {
            schema = SchemaVersion,
            mode = "readiness",
            generatedUtc = DateTimeOffset.UtcNow.ToString("O"),
            elapsedMs = totalElapsedMs,
            disposition = report.IsFullyReady ? "PASS" : "HOLD",
            slices = report.Slices.Select(
                static s => new
                {
                    s.SliceName,
                    s.TotalHeaderRows,
                    s.HeadersWithRelationalRows,
                    s.HeadersMissingRelationalRows,
                    ready = s.IsReady,
                }).ToArray(),
        };

        return JsonSerializer.Serialize(payload, IndentedOptions);
    }
}
