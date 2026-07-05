using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ComparisonRecordPayloadRehydratorTests
{
    [Fact]
    public void RehydrateEndToEnd_null_record_throws()
    {
        Action act = () => ComparisonRecordPayloadRehydrator.RehydrateEndToEnd(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void RehydrateEndToEnd_empty_payload_returns_null()
    {
        ComparisonRecord record = new() { ComparisonRecordId = "c1", PayloadJson = "  " };

        ComparisonRecordPayloadRehydrator.RehydrateEndToEnd(record).Should().BeNull();
    }

    [Fact]
    public void RehydrateEndToEnd_valid_json_returns_report()
    {
        EndToEndReplayComparisonReport report = new() { LeftRunId = "left", RightRunId = "right" };
        string json = JsonSerializer.Serialize(report, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new() { ComparisonRecordId = "c1", PayloadJson = json };

        EndToEndReplayComparisonReport? result = ComparisonRecordPayloadRehydrator.RehydrateEndToEnd(record);

        result.Should().NotBeNull();
        result!.LeftRunId.Should().Be("left");
        result.RightRunId.Should().Be("right");
    }

    [Fact]
    public void RehydrateEndToEnd_corrupt_json_throws_InvalidOperationException()
    {
        ComparisonRecord record = new() { ComparisonRecordId = "bad", PayloadJson = "{not-json" };

        Action act = () => ComparisonRecordPayloadRehydrator.RehydrateEndToEnd(record);

        act.Should().Throw<InvalidOperationException>().WithMessage("*bad*");
    }

    [Fact]
    public void RehydrateExportDiff_valid_json_returns_diff()
    {
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "l",
            RightExportRecordId = "r",
            LeftRunId = "lr",
            RightRunId = "rr"
        };
        string json = JsonSerializer.Serialize(diff, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new() { ComparisonRecordId = "c2", PayloadJson = json };

        ExportRecordDiffResult? result = ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record);

        result.Should().NotBeNull();
        result!.LeftExportRecordId.Should().Be("l");
    }

    [Fact]
    public void RehydrateExportDiff_corrupt_json_throws_InvalidOperationException()
    {
        ComparisonRecord record = new() { ComparisonRecordId = "bad-diff", PayloadJson = "[]" };

        Action act = () => ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record);

        act.Should().Throw<InvalidOperationException>().WithMessage("*bad-diff*");
    }
}
