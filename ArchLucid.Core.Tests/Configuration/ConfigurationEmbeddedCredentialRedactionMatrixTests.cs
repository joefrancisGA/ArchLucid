using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;

/// <summary>
///     Matrix coverage for delimiter-agnostic embedded credential detection in config summary effective values.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConfigurationEmbeddedCredentialRedactionMatrixTests
{
    private const string ConfigPath = "ArchLucid:SomeFeature:Settings";

    [Theory]
    [InlineData("Server=prod;Password=secret")]
    [InlineData("contoso.redis.cache.windows.net:6380,password=secret,ssl=True")]
    [InlineData("host=db.internal|password=super-secret|sslmode=require")]
    [InlineData("user=admin&password=super-secret&sslmode=require")]
    [InlineData("Password = super-secret")]
    [InlineData("PWD=super-secret")]
    [InlineData("AccountKey=super-secret")]
    [InlineData("SharedAccessKey=super-secret")]
    [InlineData("sig=signed-payload-value")]
    [InlineData("client_secret=oauth-secret-value")]
    [InlineData("password:super-secret")]
    [InlineData("""password="quoted secret value";other=1""")]
    [InlineData("postgresql://dbuser:dbpass@db.example.com:5432/app")]
    [InlineData("dbuser:dbpass@db.example.com:5432/app")]
    [InlineData("https://account.blob.core.windows.net/c;AccountKey=secret")]
    public void Resolve_redacts_embedded_credential_material_delimiter_agnostic_matrix(string effectiveValue)
    {
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_on_next_line()
    {
        string effectiveValue = "Server=prod" + '\n' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_pwd_pair_is_tab_delimited()
    {
        string effectiveValue = "Server=prod" + '\t' + "Pwd=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_form_feed_delimited()
    {
        string effectiveValue = "Server=prod" + '\f' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_vertical_tab_delimited()
    {
        string effectiveValue = "Server=prod" + '\v' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_unicode_line_separator_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2028' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_nbsp_delimited()
    {
        string effectiveValue = "Server=prod" + '\u00A0' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_thin_space_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2009' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_narrow_no_break_space_delimited()
    {
        string effectiveValue = "Server=prod" + '\u202F' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_en_space_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2002' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_figure_space_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2007' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_punctuation_space_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2008' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_hair_space_delimited()
    {
        string effectiveValue = "Server=prod" + '\u200A' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_medium_mathematical_space_delimited()
    {
        string effectiveValue = "Server=prod" + '\u205F' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_em_space_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2003' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_three_per_em_space_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2004' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_four_per_em_space_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2005' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_six_per_em_space_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2006' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_ideographic_space_delimited()
    {
        string effectiveValue = "Server=prod" + '\u3000' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_en_quad_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2000' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_em_quad_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2001' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_ogham_space_mark_delimited()
    {
        string effectiveValue = "Server=prod" + '\u1680' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_narrow_no_break_hyphen_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2011' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_zero_width_space_delimited()
    {
        string effectiveValue = "Server=prod" + '\u200B' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_figure_dash_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2012' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_zero_width_non_joiner_delimited()
    {
        string effectiveValue = "Server=prod" + '\u200C' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_zero_width_joiner_delimited()
    {
        string effectiveValue = "Server=prod" + '\u200D' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_soft_hyphen_delimited()
    {
        string effectiveValue = "Server=prod" + '\u00AD' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_mongolian_vowel_separator_delimited()
    {
        string effectiveValue = "Server=prod" + '\u180E' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_en_dash_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2013' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_em_dash_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2014' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_horizontal_bar_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2015' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_minus_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2212' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_word_joiner_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2060' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_left_to_right_mark_delimited()
    {
        string effectiveValue = "Server=prod" + '\u200E' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_right_to_left_mark_delimited()
    {
        string effectiveValue = "Server=prod" + '\u200F' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_fullwidth_hyphen_minus_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF0D' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_small_hyphen_minus_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE63' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_division_slash_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2215' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_left_to_right_embedding_delimited()
    {
        string effectiveValue = "Server=prod" + '\u202A' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_right_to_left_embedding_delimited()
    {
        string effectiveValue = "Server=prod" + '\u202B' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_pop_directional_formatting_delimited()
    {
        string effectiveValue = "Server=prod" + '\u202C' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_left_to_right_override_delimited()
    {
        string effectiveValue = "Server=prod" + '\u202D' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_right_to_left_override_delimited()
    {
        string effectiveValue = "Server=prod" + '\u202E' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_left_to_right_isolate_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2066' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_right_to_left_isolate_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2067' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_first_strong_isolate_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2068' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_pop_directional_isolate_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2069' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_inhibit_symmetric_swapping_delimited()
    {
        string effectiveValue = "Server=prod" + '\u206A' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_inhibit_arabic_form_shaping_delimited()
    {
        string effectiveValue = "Server=prod" + '\u206B' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_activate_arabic_form_shaping_delimited()
    {
        string effectiveValue = "Server=prod" + '\u206C' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_activate_arabic_form_shaping_mark_delimited()
    {
        string effectiveValue = "Server=prod" + '\u206D' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_account_key_pair_is_tab_delimited()
    {
        string effectiveValue = "Endpoint=x" + '\t' + "AccountKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_backslash_delimited()
    {
        string effectiveValue = "Server=prod" + '\\' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_percent_encoded_in_query()
    {
        const string effectiveValue = "redirect=https://x?ClientSecret%3Dabc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_doubly_percent_encoded_in_query()
    {
        const string effectiveValue = "redirect=https://x?ClientSecret%253Dabc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_percent_encoded_with_plus_in_secret()
    {
        const string effectiveValue = "redirect=https://x?ClientSecret%3Dabc%2Bdef";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_slash_delimited()
    {
        string effectiveValue = "Server=prod" + '/' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_triply_percent_encoded_in_query()
    {
        const string effectiveValue = "redirect=https://x?ClientSecret%25253Dabc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_fullwidth_solidus_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF0F' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_fraction_slash_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2044' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_quadruply_percent_encoded_in_query()
    {
        const string effectiveValue = "redirect=https://x?ClientSecret%2525253Dabc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_big_solidus_delimited()
    {
        string effectiveValue = "Server=prod" + '\u29F8' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_quintuply_percent_encoded_in_query()
    {
        const string effectiveValue = "redirect=https://x?ClientSecret%252525253Dabc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_reverse_solidus_delimited()
    {
        string effectiveValue = "Server=prod" + '\u29F9' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_small_solidus_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE68' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_sextuply_percent_encoded_in_query()
    {
        const string effectiveValue = "redirect=https://x?ClientSecret%25252525253Dabc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_fullwidth_reverse_solidus_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF3C' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_set_minus_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2216' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_septuply_percent_encoded_in_query()
    {
        const string effectiveValue = "redirect=https://x?ClientSecret%2525252525253Dabc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_box_drawing_diagonal_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2571' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_presentation_form_vertical_bar_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE31' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_octuply_percent_encoded_in_query()
    {
        const string effectiveValue = "redirect=https://x?ClientSecret%252525252525253Dabc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_box_drawing_reverse_diagonal_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2572' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_presentation_form_horizontal_bar_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE32' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_thirteen_layer_percent_encoded_in_query()
    {
        const string effectiveValue = "redirect=https://x?ClientSecret%252525252525252525253Dabc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_presentation_form_percent_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE6A' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_seventeen_layer_percent_encoded_in_query()
    {
        const string effectiveValue = "redirect=https://x?ClientSecret%252525252525252525252525253Dabc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_presentation_form_dollar_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE69' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_account_key_pair_is_vertical_tab_delimited()
    {
        string effectiveValue = "Server=prod" + '\v' + "AccountKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_twenty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 25; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_presentation_form_cent_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE6B' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_interlinear_annotation_anchor_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFF9' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_thirty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 33; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_fullwidth_yen_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE5' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_interlinear_annotation_separator_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFA' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_forty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 49; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_presentation_form_won_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE6' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_secret_pair_is_object_replacement_character_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFC' + "Secret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_sixty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 65; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_replacement_character_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFD' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_byte_order_mark_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEFF' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_ninety_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 97; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_variation_selector_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE00' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_uses_lowercase_key_name()
    {
        const string effectiveValue = "Server=prod;clientsecret=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_hundred_twenty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 129; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_variation_selector_2_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE01' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_uses_uppercase_key_name()
    {
        const string effectiveValue = "Server=prod;CLIENTSECRET=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_hundred_ninety_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 193; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_variation_selector_3_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE02' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_uses_uppercase_key_name()
    {
        const string effectiveValue = "Server=prod;PASSWORD=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_hundred_fifty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 257; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_variation_selector_4_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE03' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_account_key_pair_uses_uppercase_key_name()
    {
        const string effectiveValue = "Server=prod;ACCOUNTKEY=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_hundred_twenty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 321; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_variation_selector_5_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE04' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_shared_access_key_pair_uses_uppercase_key_name()
    {
        const string effectiveValue = "Server=prod;SHAREDACCESSKEY=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_hundred_eighty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 385; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_variation_selector_6_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE05' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_pwd_pair_uses_uppercase_key_name()
    {
        const string effectiveValue = "Server=prod;PWD=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_four_hundred_forty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 449; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_variation_selector_7_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE06' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_uses_uppercase_key_name()
    {
        const string effectiveValue = "Server=prod;APIKEY=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_five_hundred_thirteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 513; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_variation_selector_8_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE07' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_uses_uppercase_key_name()
    {
        const string effectiveValue = "Server=prod;TOKEN=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_five_hundred_seventy_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 577; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_variation_selector_9_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE08' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_six_hundred_forty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 641; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_variation_selector_10_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE09' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_seven_hundred_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 705; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_variation_selector_11_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE0A' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_seven_hundred_sixty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 769; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_variation_selector_12_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE0B' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_eight_hundred_thirty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 833; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_variation_selector_13_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE0C' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_eight_hundred_ninety_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 897; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_variation_selector_14_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE0D' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_nine_hundred_sixty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 961; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_variation_selector_15_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE0E' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_access_token_pair_uses_uppercase_key_name()
    {
        const string effectiveValue = "Server=prod;ACCESSTOKEN=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_twenty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1025; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_variation_selector_16_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE0F' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_uses_uppercase_snake_case_key_name()
    {
        const string effectiveValue = "Server=prod;CLIENT_SECRET=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_eighty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1089; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_one_hundred_fifty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1153; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_two_hundred_seventeen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1217; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_two_hundred_eighty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1281; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_three_hundred_forty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1345; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_four_hundred_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1409; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_four_hundred_seventy_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1473; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_five_hundred_thirty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1537; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_six_hundred_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1601; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_six_hundred_sixty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1665; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_seven_hundred_twenty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1729; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_seven_hundred_ninety_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1793; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_eight_hundred_fifty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1857; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_nine_hundred_twenty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1921; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_one_thousand_nine_hundred_eighty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 1985; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_forty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2049; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_one_hundred_thirteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2113; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_one_hundred_seventy_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2177; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_two_hundred_forty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2241; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_three_hundred_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2305; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_three_hundred_sixty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2369; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_four_hundred_thirty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2433; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_four_hundred_ninety_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2497; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_five_hundred_sixty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2561; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_six_hundred_twenty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2625; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_six_hundred_eighty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2689; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_seven_hundred_fifty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2753; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_eight_hundred_seventeen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2817; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_eight_hundred_eighty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2881; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_two_thousand_nine_hundred_forty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 2945; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3009; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seventy_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3073; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_one_hundred_thirty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3137; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_two_hundred_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3201; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_two_hundred_sixty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3265; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_twenty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3329; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_thirty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3330; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_thirty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3331; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_thirty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3332; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_thirty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3333; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_thirty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3334; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_thirty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3335; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_thirty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3336; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_thirty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3337; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_thirty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3338; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_thirty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3339; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_forty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3340; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_forty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3341; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_forty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3342; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_forty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3343; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_forty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3344; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_forty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3345; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_forty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3346; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_forty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3347; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_forty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3348; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_forty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3349; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_fifty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3350; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_fifty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3351; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_fifty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3352; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_fifty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3353; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_fifty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3354; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_fifty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3355; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_fifty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3356; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_fifty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3357; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_fifty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3358; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_fifty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3359; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_sixty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3360; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_sixty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3361; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_sixty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3362; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_sixty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3363; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_sixty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3364; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_sixty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3365; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_sixty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3366; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_sixty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3367; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_sixty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3368; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_sixty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3369; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_seventy_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3370; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_seventy_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3371; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_seventy_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3372; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_seventy_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3373; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_seventy_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3374; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_seventy_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3375; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_seventy_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3376; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_seventy_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3377; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_seventy_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3378; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_seventy_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3379; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_eighty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3380; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_presentation_form_yen_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE6D' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_madda_above_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE74' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_presentation_hamza_below_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE77' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_tatweel_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE70' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_alef_hamza_above_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE7A' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_presentation_madda_above_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE7D' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_alef_isolated_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE80' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_isolated_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE83' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE86' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_two_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE89' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_three_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE8C' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_four_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE95' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_five_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE98' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_six_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE9B' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_medial_form_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE8F' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_beh_medial_form_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE92' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_presentation_form_pound_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE6C' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_presentation_form_small_hyphen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE6F' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_superscript_alef_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE71' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_hamza_above_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE73' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_presentation_hamza_above_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE76' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_madda_above_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE78' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_alef_madda_above_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE7B' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_presentation_hamza_above_isolated_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE7E' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_beh_isolated_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE81' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_final_isolated_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE84' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_initial_form_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE87' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_initial_form_two_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE8A' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_isolated_form_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE8D' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_beh_isolated_form_two_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE90' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_beh_final_form_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE93' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_initial_form_three_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE96' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_two_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE99' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_isolated_form_two_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE9E' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_initial_form_four_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEA1' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_isolated_form_three_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEA4' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_isolated_form_four_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEA7' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_presentation_form_cent_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE6B' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_alef_madda_above_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE72' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_hamza_below_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE75' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_presentation_hamza_below_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE7C' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_presentation_hamza_below_isolated_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE7F' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE82' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_isolated_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE85' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_medial_form_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE88' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_medial_form_two_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE8B' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_medial_form_three_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE97' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_medial_form_four_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE9A' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_final_form_seven_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE9C' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_medial_form_five_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE9F' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_medial_form_six_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEA2' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_medial_form_seven_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEA5' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_medial_form_eight_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEA8' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_twelve_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEA9' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_isolated_form_five_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEAA' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_medial_form_nine_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEAB' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_thirteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEAC' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_isolated_form_six_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEAD' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_medial_form_ten_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEAE' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_fourteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEAF' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_seven_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEB0' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_eleven_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEB1' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_fifteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEB2' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_eight_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEB3' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_twelve_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEB4' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_sixteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEB5' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_nine_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEB6' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_thirteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEB7' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_seventeen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEB8' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_ten_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEB9' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_eight_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE9D' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_nine_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEA0' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_ten_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEA3' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_eleven_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEA6' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_initial_form_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE8E' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_beh_initial_form_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE91' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE94' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_presentation_hamza_above_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE79' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_presentation_form_won_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE6E' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_presentation_form_dollar_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE69' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_small_solidus_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFE68' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_fullwidth_reverse_solidus_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF3C' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_replacement_character_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFD' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_object_replacement_character_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFC' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_access_key_pair_uses_uppercase_key_name()
    {
        const string effectiveValue = "Server=prod;ACCESSKEY=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_interlinear_annotation_separator_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFA' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_sig_pair_uses_uppercase_key_name()
    {
        const string effectiveValue = "Server=prod;SIG=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_percent_encoded_slash_delimited()
    {
        const string effectiveValue = "Server=prod%2FPassword=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_activate_national_digit_shapes_delimited()
    {
        string effectiveValue = "Server=prod" + '\u206E' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_activate_nominal_digit_shapes_delimited()
    {
        string effectiveValue = "Server=prod" + '\u206F' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_ascii_space_delimited()
    {
        string effectiveValue = "Server=prod Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_nel_delimited()
    {
        string effectiveValue = "Server=prod" + '\u0085' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_paragraph_separator_delimited()
    {
        string effectiveValue = "Server=prod" + '\u2029' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    private static void AssertRedacts(string effectiveValue)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [ConfigPath] = effectiveValue,
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, ConfigPath, isSet: true);

        value.Should().Be("***");
    }

    [Theory]
    [InlineData("Passwordless=true")]
    [InlineData("Server = prod.database.windows.net")]
    [InlineData("https://example.com/no-userinfo")]
    [InlineData("postgresql://db.example.com:5432/app")]
    public void Resolve_preserves_non_credential_effective_values_delimiter_agnostic_matrix(string effectiveValue)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [ConfigPath] = effectiveValue,
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, ConfigPath, isSet: true);

        value.Should().Be(effectiveValue);
    }
}
