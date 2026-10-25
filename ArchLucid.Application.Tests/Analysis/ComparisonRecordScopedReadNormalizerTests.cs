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

    [Fact]
    public void CompareQuality_comparison_record_scoped_read_normalizer_dedupes_tags_that_differ_only_by_casing()
    {
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "cmp-tag-dedupe-casing",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            Tags = ["Release-Alpha", "release-alpha", "beta"],
        };

        ComparisonRecordScopedReadNormalizer.NormalizeInPlace(record);

        record.Tags.Should().Equal("Release-Alpha", "beta");
    }

    [Fact]
    public void CompareQuality_comparison_record_scoped_read_normalizer_clears_unknown_comparison_type_and_format()
    {
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "cmp-unknown-type-format",
            ComparisonType = "legacyPlaceholder",
            Format = "legacyPlaceholder",
        };

        ComparisonRecordScopedReadNormalizer.NormalizeInPlace(record);

        record.ComparisonType.Should().BeEmpty();
        record.Format.Should().BeEmpty();
    }

    [Fact]
    public void CompareQuality_comparison_record_scoped_read_normalizer_canonicalizes_known_comparison_type_and_format()
    {
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "cmp-known-type-format",
            ComparisonType = "  END-TO-END-REPLAY  ",
            Format = "json+markdown",
        };

        ComparisonRecordScopedReadNormalizer.NormalizeInPlace(record);

        record.ComparisonType.Should().Be(ComparisonTypes.EndToEndReplay);
        record.Format.Should().Be(ComparisonTypes.FormatJsonMarkdown);
    }

    [Fact]
    public void CompareQuality_comparison_record_scoped_read_normalizer_canonicalizes_known_format_case_insensitively()
    {
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "cmp-format-case",
            Format = "  JSON+MARKDOWN  ",
        };

        ComparisonRecordScopedReadNormalizer.NormalizeInPlace(record);

        record.Format.Should().Be(ComparisonTypes.FormatJsonMarkdown);
    }

    [Fact]
    public void CompareQuality_comparison_record_scoped_read_normalizer_dedupes_duplicate_tags()
    {
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "cmp-duplicate-tags",
            Tags = ["  alpha  ", "alpha", " beta ", "beta", "   "],
        };

        ComparisonRecordScopedReadNormalizer.NormalizeInPlace(record);

        record.Tags.Should().Equal(["alpha", "beta"]);
    }
}
