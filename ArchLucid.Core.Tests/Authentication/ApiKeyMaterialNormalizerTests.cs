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

    [Fact]
    public void Normalize_strips_embedded_left_to_right_isolate_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\u2066ret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_left_to_right_isolate_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\u2066").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_embedded_soft_hyphen_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\u00ADret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_soft_hyphen_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\u00AD").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_lowercases_ascii_hex_key_material()
    {
        const string uppercaseHex =
            "A1B2C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF12345678";

        ApiKeyMaterialNormalizer.Normalize(uppercaseHex).Should().Be(uppercaseHex.ToLowerInvariant());
    }

    [Fact]
    public void Normalize_compose_nfd_key_material_to_nfc_before_invisible_char_stripping()
    {
        const string nfc = "architecture-caf\u00e9-key";
        const string nfd = "architecture-cafe\u0301-key";

        ApiKeyMaterialNormalizer.Normalize(nfd).Should().Be(ApiKeyMaterialNormalizer.Normalize(nfc));
    }

    [Fact]
    public void Normalize_preserves_case_for_non_hex_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("api-key-bdr-Admin-aB3x").Should().Be("api-key-bdr-Admin-aB3x");
    }

    [Fact]
    public void Normalize_strips_embedded_no_break_space_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\u00A0ret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_embedded_tab_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\tret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_tab_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\t").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_embedded_line_separator_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\u2028ret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_line_separator_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\u2028").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_no_break_space_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\u00A0").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_embedded_hangul_filler_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\u3164ret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_hangul_filler_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\u3164").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_embedded_braille_blank_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\u2800ret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_braille_blank_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\u2800").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_embedded_combining_grapheme_joiner_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\u034Fret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_combining_grapheme_joiner_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\u034F").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_embedded_variation_selector_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\uFE00ret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_variation_selector_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\uFE00").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_embedded_combining_grave_tone_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\u0340ret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_embedded_enclosing_mark_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\u0489ret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_enclosing_mark_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\u0489").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_language_tag_char_embedded_in_key_material()
    {
        string withTag = "sec" + char.ConvertFromUtf32(0xE0020) + "ret-admin";
        ApiKeyMaterialNormalizer.Normalize(withTag).Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_language_tag_char_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize(char.ConvertFromUtf32(0xE0020)).Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_variation_selector_supplement_embedded_in_key_material()
    {
        string withVs = "sec" + char.ConvertFromUtf32(0xE0100) + "ret-admin";
        ApiKeyMaterialNormalizer.Normalize(withVs).Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_variation_selector_supplement_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize(char.ConvertFromUtf32(0xE0100)).Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_replacement_char_embedded_in_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\uFFFDret-admin").Should().Be("secret-admin");
    }

    [Fact]
    public void Normalize_strips_replacement_char_only_material_to_empty()
    {
        ApiKeyMaterialNormalizer.Normalize("\uFFFD").Should().BeEmpty();
    }

    [Fact]
    public void Normalize_strips_ill_formed_utf16_lone_surrogate_from_key_material()
    {
        ApiKeyMaterialNormalizer.Normalize("sec\uD800ret-admin").Should().Be("secret-admin");
    }
}
