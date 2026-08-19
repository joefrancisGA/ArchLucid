using ArchLucid.Core.Authentication;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Authentication;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ApiKeyMaterialMaskerTests
{
    [Fact]
    public void MaskCommaSeparatedSegments_returns_empty_when_unset()
    {
        ApiKeyMaterialMasker.MaskCommaSeparatedSegments(null).Should().BeEmpty();
        ApiKeyMaterialMasker.MaskCommaSeparatedSegments(" , ").Should().BeEmpty();
    }

    [Fact]
    public void MaskCommaSeparatedSegments_masks_each_segment()
    {
        IReadOnlyList<string> masked =
            ApiKeyMaterialMasker.MaskCommaSeparatedSegments("abcdefghijklmnop, short");

        masked.Should().Equal("****mnop", "****");
    }
}
