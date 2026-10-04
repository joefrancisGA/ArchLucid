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

    [Fact]
    public void Normalize_strips_embedded_zero_width_space_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\u200Bret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_zero_width_non_joiner_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\u200C").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_embedded_left_to_right_mark_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\u200Eret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_left_to_right_mark_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\u200E").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_embedded_left_to_right_embedding_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\u202Aret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_left_to_right_embedding_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\u202A").Should().BeEmpty();
    }
}
