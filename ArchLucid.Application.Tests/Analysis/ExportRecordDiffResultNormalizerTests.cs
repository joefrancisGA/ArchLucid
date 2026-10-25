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

        diff.RequestDiff.LeftRequest!.CompareRunId.Should().BeNull();
        diff.RequestDiff.RightRequest!.CompareRunId.Should().Be(compareRunGuid.ToString("N"));
    }
}
