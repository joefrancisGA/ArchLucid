using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Metadata;

[Trait("Category", "Unit")]
public sealed class OptionalExportMetadataStringNormalizerTests
{
    [Fact]
    public void NormalizeOptionalString_nulls_whitespace_only_values()
    {
        OptionalExportMetadataStringNormalizer.NormalizeOptionalString("   ").Should().BeNull();
    }

    [Fact]
    public void NormalizeOptionalString_trims_meaningful_values()
    {
        OptionalExportMetadataStringNormalizer.NormalizeOptionalString("  sponsor  ").Should().Be("sponsor");
    }
}
