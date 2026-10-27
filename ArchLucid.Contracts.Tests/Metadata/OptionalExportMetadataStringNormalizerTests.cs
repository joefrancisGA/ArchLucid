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

    [Fact]
    public void NormalizeOptionalString_canonicalizes_unicode_to_form_c()
    {
        const string composed = "Caf\u00e9";
        const string decomposed = "Cafe\u0301";

        OptionalExportMetadataStringNormalizer.NormalizeOptionalString(decomposed).Should().Be(composed);
    }

    [Fact]
    public void NormalizeOptionalString_canonicalizes_crlf_line_endings_to_lf()
    {
        OptionalExportMetadataStringNormalizer.NormalizeOptionalString("line one\r\nline two")
            .Should()
            .Be("line one\nline two");
    }
}
