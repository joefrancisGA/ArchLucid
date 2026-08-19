using System.Text.Json;

using ArchLucid.Backfill.Cli;
using ArchLucid.Persistence.Coordination.Backfill;

using Xunit;

namespace ArchLucid.Architecture.Tests;

[Trait("Category", "Unit")]
public sealed class BackfillCliJsonReportSerializerTests
{
    [Fact]
    public void SerializeBackfillReport_includes_stage_timings_and_failures()
    {
        SqlRelationalBackfillReport report = new()
        {
            ProcessedCount = 3,
            SuccessCount = 2,
            FailureCount = 1,
        };

        report.StageTimings.Add(
            new SqlRelationalBackfillStageTiming
            {
                Stage = "ContextSnapshots",
                ElapsedMilliseconds = 42,
                ProcessedCount = 3,
                SuccessCount = 2,
                FailureCount = 1,
            });

        report.Failures.Add(
            new SqlRelationalBackfillFailure
            {
                Stage = "ContextSnapshots",
                EntityKey = "id-1",
                Message = "boom",
            });

        string json = BackfillCliJsonReportSerializer.SerializeBackfillReport(report, totalElapsedMs: 100);

        using JsonDocument document = JsonDocument.Parse(json);
        JsonElement root = document.RootElement;

        Assert.Equal(BackfillCliJsonReportSerializer.SchemaVersion, root.GetProperty("schema").GetString());
        Assert.Equal("backfill", root.GetProperty("mode").GetString());
        Assert.Equal("HOLD", root.GetProperty("disposition").GetString());
        Assert.Equal(100, root.GetProperty("elapsedMs").GetInt64());

        JsonElement stage = root.GetProperty("stages")[0];
        Assert.Equal("ContextSnapshots", stage.GetProperty("Stage").GetString());
        Assert.Equal(42, stage.GetProperty("ElapsedMilliseconds").GetInt64());
    }

    [Fact]
    public void SerializeReadinessReport_includes_slice_coverage()
    {
        CutoverReadinessReport report = new()
        {
            Slices =
            [
                new CutoverSliceReadiness
                {
                    SliceName = "ContextSnapshots",
                    TotalHeaderRows = 10,
                    HeadersWithRelationalRows = 8,
                },
            ],
        };

        string json = BackfillCliJsonReportSerializer.SerializeReadinessReport(report, totalElapsedMs: 50);

        using JsonDocument document = JsonDocument.Parse(json);
        JsonElement root = document.RootElement;

        Assert.Equal("readiness", root.GetProperty("mode").GetString());
        Assert.Equal("HOLD", root.GetProperty("disposition").GetString());
        Assert.Equal("ContextSnapshots", root.GetProperty("slices")[0].GetProperty("SliceName").GetString());
    }

    [Fact]
    public void TryParse_output_json_with_optional_path()
    {
        Assert.True(
            BackfillCliOutputJsonOptionsParser.TryParse(["--output-json", "report.json"], out bool enabled, out string? path));
        Assert.True(enabled);
        Assert.Equal("report.json", path);

        Assert.True(BackfillCliOutputJsonOptionsParser.TryParse(["--output-json"], out enabled, out path));
        Assert.True(enabled);
        Assert.Null(path);
    }
}
