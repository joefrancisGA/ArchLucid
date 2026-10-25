using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ComparisonRecordScopedReadNormalizerTests
{
    [Fact]
    public void CompareQuality_comparison_record_scoped_read_normalizer_nulls_whitespace_only_export_record_id_columns()
    {
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "cmp-whitespace-export-ids",
            LeftExportRecordId = "   ",
            RightExportRecordId = "  right-anchor  ",
        };

        ComparisonRecordScopedReadNormalizer.NormalizeInPlace(record);

        record.LeftExportRecordId.Should().BeNull();
        record.RightExportRecordId.Should().Be("right-anchor");
    }

    [Fact]
    public void CompareQuality_comparison_record_scoped_read_normalizer_nulls_whitespace_only_run_id_columns_and_canonicalizes_padded_guids()
    {
        Guid rightRunGuid = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "cmp-whitespace-run-ids",
            LeftRunId = "   ",
            RightRunId = $"  {rightRunGuid:D}  ",
        };

        ComparisonRecordScopedReadNormalizer.NormalizeInPlace(record);

        record.LeftRunId.Should().BeNull();
        record.RightRunId.Should().Be(rightRunGuid.ToString("N"));
    }

    [Fact]
    public void CompareQuality_comparison_record_scoped_read_normalizer_nulls_whitespace_only_label()
    {
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "cmp-whitespace-label",
            Label = "   ",
        };

        ComparisonRecordScopedReadNormalizer.NormalizeInPlace(record);

        record.Label.Should().BeNull();
    }

    [Fact]
    public void CompareQuality_comparison_record_scoped_read_normalizer_clears_whitespace_only_format_type_summary_and_tags()
    {
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "cmp-whitespace-text-columns",
            Format = "   ",
            ComparisonType = "  ",
            SummaryMarkdown = "   ",
            Tags = ["  alpha  ", "   ", " beta "],
        };

        ComparisonRecordScopedReadNormalizer.NormalizeInPlace(record);

        record.Format.Should().BeEmpty();
        record.ComparisonType.Should().BeEmpty();
        record.SummaryMarkdown.Should().BeNull();
        record.Tags.Should().BeEquivalentTo(["alpha", "beta"]);
    }
}
