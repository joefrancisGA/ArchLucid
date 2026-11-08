using ArchLucid.Application.Analysis;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ComparisonTypeNormalizerTests
{
    [Fact]
    public void CompareQuality_ComparisonTypeNormalizer_returns_empty_string_for_whitespace_only_input()
    {
        ComparisonTypeNormalizer.NormalizeForLookup("   ").Should().BeEmpty();
        ComparisonTypeNormalizer.NormalizeForLookup("\t").Should().BeEmpty();
    }

    [Fact]
    public void CompareQuality_ComparisonTypeNormalizer_trims_meaningful_type_tokens()
    {
        ComparisonTypeNormalizer
            .NormalizeForLookup($"  {ComparisonTypes.EndToEndReplay}  ")
            .Should()
            .Be(ComparisonTypes.EndToEndReplay);
    }
}
