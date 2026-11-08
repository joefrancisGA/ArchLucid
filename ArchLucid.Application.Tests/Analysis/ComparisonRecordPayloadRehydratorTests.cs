using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Common;
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
    public void RehydrateEndToEnd_canonicalizes_dashed_padded_run_ids_in_payload()
    {
        Guid leftGuid = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid rightGuid = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        string leftCanonical = leftGuid.ToString("N");
        string rightCanonical = rightGuid.ToString("N");

        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = $"{leftGuid:D}  ",
            RightRunId = $"{rightGuid:D}  ",
        };
        string json = JsonSerializer.Serialize(report, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new() { ComparisonRecordId = "c-dashed", PayloadJson = json };

        EndToEndReplayComparisonReport? result = ComparisonRecordPayloadRehydrator.RehydrateEndToEnd(record);

        result.Should().NotBeNull();
        result!.LeftRunId.Should().Be(leftCanonical);
        result.RightRunId.Should().Be(rightCanonical);
    }

    [Fact]
    public void CompareQuality_RehydrateEndToEnd_returns_null_when_payload_is_immaterial_and_record_has_no_run_anchors()
    {
        EndToEndReplayComparisonReport report = new()
        {
            RunDiff = new RunMetadataDiffResult
            {
                ChangedFields = ["legacyPlaceholder", "   "],
                StatusDiffers = true,
                RequestIdsDiffer = true,
            },
        };
        string json = JsonSerializer.Serialize(report, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "c-immaterial-e2e",
            PayloadJson = json,
        };

        ComparisonRecordPayloadRehydrator.RehydrateEndToEnd(record).Should().BeNull();
    }

    [Fact]
    public void CompareQuality_RehydrateEndToEnd_returns_null_when_payload_is_immaterial_and_record_only_supplies_run_anchors()
    {
        EndToEndReplayComparisonReport report = new()
        {
            RunDiff = new RunMetadataDiffResult
            {
                ChangedFields = ["legacyPlaceholder"],
                StatusDiffers = true,
                RequestIdsDiffer = true,
            },
        };
        string json = JsonSerializer.Serialize(report, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "c-immaterial-e2e-record-anchors",
            LeftRunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            RightRunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            PayloadJson = json,
        };

        ComparisonRecordPayloadRehydrator.RehydrateEndToEnd(record).Should().BeNull();
    }

    [Fact]
    public void CompareQuality_RehydrateEndToEnd_backfills_report_run_ids_from_comparison_record_columns()
    {
        Guid leftGuid = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid rightGuid = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        string leftCanonical = leftGuid.ToString("N");
        string rightCanonical = rightGuid.ToString("N");

        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "   ",
            RightRunId = "\t",
        };
        string json = JsonSerializer.Serialize(report, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "c-e2e-record-anchors",
            LeftRunId = $"{leftGuid:D}  ",
            RightRunId = $"{rightGuid:D}  ",
            PayloadJson = json,
        };

        EndToEndReplayComparisonReport? result = ComparisonRecordPayloadRehydrator.RehydrateEndToEnd(record);

        result.Should().NotBeNull();
        result!.LeftRunId.Should().Be(leftCanonical);
        result.RightRunId.Should().Be(rightCanonical);
    }

    [Fact]
    public void CompareQuality_RehydrateEndToEnd_backfills_nested_agent_run_ids_from_comparison_record_columns()
    {
        Guid leftGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid rightGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string leftCanonical = leftGuid.ToString("N");
        string rightCanonical = rightGuid.ToString("N");

        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "   ",
            RightRunId = "   ",
            AgentResultDiff = new AgentResultDiffResult
            {
                AgentDeltas =
                [
                    new AgentResultDelta
                    {
                        AgentType = AgentType.Topology,
                        AddedClaims = ["claim-a"],
                    },
                ],
            },
        };
        string json = JsonSerializer.Serialize(report, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "c-e2e-nested-anchors",
            LeftRunId = leftCanonical,
            RightRunId = rightCanonical,
            PayloadJson = json,
        };

        EndToEndReplayComparisonReport? result = ComparisonRecordPayloadRehydrator.RehydrateEndToEnd(record);

        result.Should().NotBeNull();
        result!.LeftRunId.Should().Be(leftCanonical);
        result.RightRunId.Should().Be(rightCanonical);
        result.AgentResultDiff!.LeftRunId.Should().Be(leftCanonical);
        result.AgentResultDiff.RightRunId.Should().Be(rightCanonical);
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
    public void RehydrateExportDiff_canonicalizes_dashed_padded_run_ids_in_payload()
    {
        Guid leftGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid rightGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string leftCanonical = leftGuid.ToString("N");
        string rightCanonical = rightGuid.ToString("N");

        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "l",
            RightExportRecordId = "r",
            LeftRunId = $"{leftGuid:D}  ",
            RightRunId = $"{rightGuid:D}  ",
        };
        string json = JsonSerializer.Serialize(diff, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new() { ComparisonRecordId = "c2-dashed", PayloadJson = json };

        ExportRecordDiffResult? result = ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record);

        result.Should().NotBeNull();
        result!.LeftRunId.Should().Be(leftCanonical);
        result.RightRunId.Should().Be(rightCanonical);
    }

    [Fact]
    public void RehydrateExportDiff_canonicalizes_dashed_compare_run_id_in_nested_request_diff()
    {
        Guid compareGuid = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string compareCanonical = compareGuid.ToString("N");
        string dashedPaddedCompareRunId = $"{compareGuid:D}  ";

        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "l",
            RightExportRecordId = "r",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            RequestDiff = new ExportRecordRequestDiff
            {
                LeftRequest = new PersistedAnalysisExportRequest
                {
                    IncludeAgentResultCompare = true,
                    CompareRunId = dashedPaddedCompareRunId,
                },
            },
        };
        string json = JsonSerializer.Serialize(diff, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new() { ComparisonRecordId = "c2-nested-compare", PayloadJson = json };

        ExportRecordDiffResult? result = ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record);

        result.Should().NotBeNull();
        result!.RequestDiff.LeftRequest.Should().NotBeNull();
        result.RequestDiff.LeftRequest!.CompareRunId.Should().Be(compareCanonical);
    }

    [Fact]
    public void RehydrateExportDiff_trims_padded_export_record_ids_in_payload()
    {
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "  left-export  ",
            RightExportRecordId = "  right-export  ",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        };
        string json = JsonSerializer.Serialize(diff, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new() { ComparisonRecordId = "c2-export-ids", PayloadJson = json };

        ExportRecordDiffResult? result = ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record);

        result.Should().NotBeNull();
        result!.LeftExportRecordId.Should().Be("left-export");
        result.RightExportRecordId.Should().Be("right-export");
    }

    [Fact]
    public void RehydrateExportDiff_trims_padded_compare_manifest_version_in_nested_request_diff()
    {
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "l",
            RightExportRecordId = "r",
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            RequestDiff = new ExportRecordRequestDiff
            {
                RightRequest = new PersistedAnalysisExportRequest
                {
                    IncludeManifestCompare = true,
                    CompareManifestVersion = "  v2  ",
                },
            },
        };
        string json = JsonSerializer.Serialize(diff, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new() { ComparisonRecordId = "c2-nested-manifest", PayloadJson = json };

        ExportRecordDiffResult? result = ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record);

        result.Should().NotBeNull();
        result!.RequestDiff.RightRequest.Should().NotBeNull();
        result.RequestDiff.RightRequest!.CompareManifestVersion.Should().Be("v2");
    }

    [Fact]
    public void CompareQuality_RehydrateExportDiff_backfills_anchors_from_comparison_record_columns()
    {
        Guid leftRunGuid = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid rightRunGuid = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        string leftRunCanonical = leftRunGuid.ToString("N");
        string rightRunCanonical = rightRunGuid.ToString("N");

        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "   ",
            RightExportRecordId = "\t",
            LeftRunId = "   ",
            RightRunId = "  ",
            ChangedTopLevelFields = ["Format"],
        };
        string json = JsonSerializer.Serialize(diff, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "c2-record-anchors",
            LeftExportRecordId = "  left-export  ",
            RightExportRecordId = "  right-export  ",
            LeftRunId = $"{leftRunGuid:D}  ",
            RightRunId = $"{rightRunGuid:D}  ",
            PayloadJson = json,
        };

        ExportRecordDiffResult? result = ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record);

        result.Should().NotBeNull();
        result!.LeftExportRecordId.Should().Be("left-export");
        result.RightExportRecordId.Should().Be("right-export");
        result.LeftRunId.Should().Be(leftRunCanonical);
        result.RightRunId.Should().Be(rightRunCanonical);
        result.ChangedTopLevelFields.Should().Equal(["Format"]);
    }

    [Fact]
    public void CompareQuality_RehydrateExportDiff_returns_null_when_payload_is_immaterial_after_normalize()
    {
        ExportRecordDiffResult diff = new()
        {
            ChangedTopLevelFields = ["legacyPlaceholder", "  legacyPlaceholder  "],
            RequestDiff = new ExportRecordRequestDiff
            {
                ChangedFlags = ["NotARealFlag"],
                ChangedValues = ["bogus"],
            },
        };
        string json = JsonSerializer.Serialize(diff, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new() { ComparisonRecordId = "c2-immaterial", PayloadJson = json };

        ExportRecordDiffResult? result = ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record);

        result.Should().BeNull();
    }

    [Fact]
    public void CompareQuality_RehydrateExportDiff_backfills_export_record_ids_when_payload_has_whitespace_only_export_anchors()
    {
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "   ",
            RightExportRecordId = "\t",
            ChangedTopLevelFields = ["legacyPlaceholder"],
            RequestDiff = new ExportRecordRequestDiff { ChangedFlags = ["NotARealFlag"] },
        };
        string json = JsonSerializer.Serialize(diff, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "c2-whitespace-export-anchors",
            LeftExportRecordId = "left-export",
            RightExportRecordId = "right-export",
            PayloadJson = json,
        };

        ExportRecordDiffResult? result = ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record);

        result.Should().NotBeNull();
        result!.LeftExportRecordId.Should().Be("left-export");
        result.RightExportRecordId.Should().Be("right-export");
    }

    [Fact]
    public void CompareQuality_RehydrateExportDiff_backfills_export_record_ids_when_payload_has_whitespace_only_run_anchors()
    {
        ExportRecordDiffResult diff = new()
        {
            LeftRunId = "   ",
            RightRunId = "\t",
            ChangedTopLevelFields = ["legacyPlaceholder"],
            RequestDiff = new ExportRecordRequestDiff { ChangedFlags = ["NotARealFlag"] },
        };
        string json = JsonSerializer.Serialize(diff, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "c2-whitespace-run-anchors",
            LeftExportRecordId = "left-export",
            RightExportRecordId = "right-export",
            PayloadJson = json,
        };

        ExportRecordDiffResult? result = ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record);

        result.Should().NotBeNull();
        result!.LeftExportRecordId.Should().Be("left-export");
        result.RightExportRecordId.Should().Be("right-export");
    }

    [Fact]
    public void CompareQuality_RehydrateExportDiff_returns_null_when_payload_is_immaterial_and_record_only_supplies_anchors()
    {
        ExportRecordDiffResult diff = new()
        {
            ChangedTopLevelFields = ["legacyPlaceholder"],
            RequestDiff = new ExportRecordRequestDiff
            {
                ChangedFlags = ["NotARealFlag"],
                ChangedValues = ["bogus"],
            },
        };
        string json = JsonSerializer.Serialize(diff, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "c2-immaterial-anchors",
            LeftExportRecordId = "left-export",
            RightExportRecordId = "right-export",
            LeftRunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            RightRunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            PayloadJson = json,
        };

        ExportRecordDiffResult? result = ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record);

        result.Should().BeNull();
    }

    [Fact]
    public void RehydrateExportDiff_corrupt_json_throws_InvalidOperationException()
    {
        ComparisonRecord record = new() { ComparisonRecordId = "bad-diff", PayloadJson = "[]" };

        Action act = () => ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record);

        act.Should().Throw<InvalidOperationException>().WithMessage("*bad-diff*");
    }
}
