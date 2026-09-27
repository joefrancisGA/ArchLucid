using ArchLucid.Core.Authentication;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Authentication;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ApiKeyMaterialNormalizerTests
{
    [Fact]
    public void Normalize_strips_zero_width_space_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\u200B").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_trailing_zero_width_space_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("reader-key\u200B").Should().Be("reader-key");
    }
}
