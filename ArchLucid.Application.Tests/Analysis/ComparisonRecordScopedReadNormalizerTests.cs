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
}
