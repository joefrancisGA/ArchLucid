using ArchLucid.Application.Analysis;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ExportRecordDiffResultNormalizerTests
{
    [Fact]
    public void CompareQuality_ExportRecordDiffResultNormalizer_clears_whitespace_only_run_id_anchors()
    {
        Guid rightRunGuid = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        ExportRecordDiffResult diff = new()
        {
            LeftRunId = "   ",
            RightRunId = $"  {rightRunGuid:D}  ",
        };

        ExportRecordDiffResultNormalizer.NormalizeDisplayAnchors(diff);

        diff.LeftRunId.Should().BeEmpty();
        diff.RightRunId.Should().Be(rightRunGuid.ToString("N"));
    }

    [Fact]
    public void CompareQuality_ExportRecordDiffResultNormalizer_nulls_whitespace_only_nested_compare_run_id()
    {
        Guid compareRunGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        ExportRecordDiffResult diff = new()
        {
            RequestDiff = new ExportRecordRequestDiff
            {
                LeftRequest = new PersistedAnalysisExportRequest { CompareRunId = "   " },
                RightRequest = new PersistedAnalysisExportRequest
                {
                    CompareRunId = $"  {compareRunGuid:D}  ",
                },
            },
        };

        ExportRecordDiffResultNormalizer.NormalizeDisplayAnchors(diff);

        diff.RequestDiff.LeftRequest.Should().BeNull();
        diff.RequestDiff.RightRequest!.CompareRunId.Should().Be(compareRunGuid.ToString("N"));
    }

    [Fact]
    public void CompareQuality_ExportRecordDiffResultNormalizer_removes_whitespace_only_warnings_and_changed_top_level_fields()
    {
        ExportRecordDiffResult diff = new()
        {
            Warnings = ["   ", "  drift on title  ", "\t"],
            ChangedTopLevelFields = [" ", "  Format  ", ""],
        };

        ExportRecordDiffResultNormalizer.NormalizeDisplayAnchors(diff);

        diff.Warnings.Should().Equal("drift on title");
        diff.ChangedTopLevelFields.Should().Equal("Format");
    }

    [Fact]
    public void CompareQuality_ExportRecordDiffResultNormalizer_removes_whitespace_only_request_diff_changed_flags_and_values()
    {
        ExportRecordDiffResult diff = new()
        {
            RequestDiff = new ExportRecordRequestDiff
            {
                ChangedFlags = ["   ", "  IncludeManifest  "],
                ChangedValues = ["\t", "  TemplateProfile  "],
            },
        };

        ExportRecordDiffResultNormalizer.NormalizeDisplayAnchors(diff);

        diff.RequestDiff.ChangedFlags.Should().Equal("IncludeManifest");
        diff.RequestDiff.ChangedValues.Should().Equal("TemplateProfile");
    }
}
