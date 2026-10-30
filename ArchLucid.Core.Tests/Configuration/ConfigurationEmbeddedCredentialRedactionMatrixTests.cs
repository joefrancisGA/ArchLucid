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
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_fullwidth_pound_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE6' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_fullwidth_cent_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE7' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_fullwidth_not_sign_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE8' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_fullwidth_small_colon_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE9' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_fullwidth_semicolon_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFEA' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_fullwidth_question_mark_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFEB' + "Password=secret";
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
    public void Resolve_redacts_embedded_credential_material_when_secret_pair_uses_uppercase_key_name()
    {
        const string effectiveValue = "Server=prod;SECRET=abc";
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
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_eighty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3381; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_eighty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3382; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_eighty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3383; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_eighty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3384; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_eighty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3385; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_eighty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3386; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_eighty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3387; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_eighty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3388; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_eighty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3389; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_ninety_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3390; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_ninety_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3391; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_ninety_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3392; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_ninety_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3393; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_ninety_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3394; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_ninety_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3395; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_ninety_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3396; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_ninety_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3397; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_ninety_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3398; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_three_hundred_ninety_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3399; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3400; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3401; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3402; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3403; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3404; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3405; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3406; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3407; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3408; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3409; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_ten_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3410; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_eleven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3411; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_twelve_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3412; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_thirteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3413; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_fourteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3414; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_fifteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3415; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_sixteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3416; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_seventeen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3417; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_eighteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3418; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_nineteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3419; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_twenty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3420; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_twenty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3421; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_twenty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3422; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_twenty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3423; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_twenty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3424; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_twenty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3425; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_twenty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3426; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_twenty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3427; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_twenty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3428; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_twenty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3429; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_thirty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3430; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_thirty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3431; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_thirty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3432; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_thirty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3433; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_thirty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3434; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_thirty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3435; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_thirty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3436; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_thirty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3437; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_thirty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3438; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_thirty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3439; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_forty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3440; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_forty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3441; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_forty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3442; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_forty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3443; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_forty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3444; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_forty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3445; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_forty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3446; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_forty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3447; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_forty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3448; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_forty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3449; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_fifty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3450; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_fifty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3451; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_fifty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3452; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_fifty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3453; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_fifty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3454; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_fifty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3455; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_fifty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3456; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_fifty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3457; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_fifty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3458; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_fifty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3459; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_sixty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3460; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_sixty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3461; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_sixty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3462; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_sixty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3463; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_sixty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3464; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_sixty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3465; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_sixty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3466; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_sixty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3467; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_sixty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3468; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_sixty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3469; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_seventy_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3470; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_seventy_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3471; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_seventy_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3472; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_seventy_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3473; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_seventy_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3474; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_seventy_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3475; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_seventy_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3476; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_seventy_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3477; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_seventy_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3478; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_seventy_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3479; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_eighty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3480; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_eighty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3481; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_eighty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3482; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_eighty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3483; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_eighty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3484; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_te_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF7E' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_eighty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3485; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_to_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF7F' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_eighty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3486; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_na_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF80' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_eighty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3487; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_ni_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF81' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_eighty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3488; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_nu_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF82' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_eighty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3489; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_ne_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF83' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_ninety_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3490; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_no_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF84' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_ninety_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3491; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_ha_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF85' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_ninety_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3492; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_hi_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF86' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_ninety_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3493; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_ho_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF87' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_ninety_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3494; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_he_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF88' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_ninety_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3495; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_ma_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF89' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_ninety_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3496; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_mi_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF8A' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_ninety_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3497; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_mu_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF8B' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_ninety_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3498; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_me_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF8C' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_four_hundred_ninety_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3499; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_mo_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF8D' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3500; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_ya_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF8E' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3501; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_yu_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF8F' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3502; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_yo_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF90' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3503; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_ra_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF91' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3504; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_ri_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF92' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3505; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_ru_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF93' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3506; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_re_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF94' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3507; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_ro_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF95' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3508; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_wa_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF96' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3509; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_wi_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF97' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_ten_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3510; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_wo_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF98' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_eleven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3511; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_n_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF99' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_twelve_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3512; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_nu_ff9a_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF9A' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_thirteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3513; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_ne_ff9b_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF9B' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_fourteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3514; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_no_ff9c_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF9C' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_fifteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3515; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_ha_ff9d_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF9D' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_sixteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3516; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_hi_ff9e_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF9E' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_seventeen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3517; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_semivoiced_sound_mark_ff9f_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF9F' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_eighteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3518; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_filler_ffa0_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA0' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_nineteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3519; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_a_ffa1_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA1' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_twenty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3520; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_b_ffa2_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA2' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_twenty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3521; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_c_ffa3_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA3' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_twenty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3522; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_d_ffa4_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA4' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_twenty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3523; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_e_ffa5_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA5' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_twenty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3524; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_f_ffa6_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA6' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_twenty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3525; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_g_ffa7_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA7' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_twenty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3526; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_h_ffa8_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA8' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_twenty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3527; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_i_ffa9_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA9' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_twenty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3528; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_j_ffaa_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAA' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_twenty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3529; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_k_ffab_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAB' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_thirty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3530; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_l_ffac_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAC' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_thirty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3531; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_m_ffad_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAD' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_thirty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3532; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_n_ffae_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAE' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_thirty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3533; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_o_ffaf_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAF' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_thirty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3534; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_p_ffb0_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB0' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_thirty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3535; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_q_ffb1_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB1' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_thirty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3536; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_r_ffb2_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB2' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_thirty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3537; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_s_ffb3_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB3' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_thirty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3538; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_t_ffb4_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB4' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_thirty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3539; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_u_ffb5_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB5' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_forty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3540; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_v_ffb6_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB6' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_forty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3541; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_w_ffb7_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB7' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_forty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3542; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_x_ffb8_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB8' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_forty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3543; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_y_ffb9_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB9' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_forty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3544; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_z_ffba_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFBA' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_forty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3545; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffbb_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFBB' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_forty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3546; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffbc_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFBC' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffbc_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFBC' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_forty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3547; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffbd_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFBD' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffbd_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFBD' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_forty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3548; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffbe_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFBE' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffbe_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFBE' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_forty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3549; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffbf_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFBF' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffbf_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFBF' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_fifty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3550; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffc0_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC0' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_fifty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3551; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffc1_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC1' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_fifty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3552; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffc2_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC2' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_fifty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3553; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffc3_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC3' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_fifty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3554; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffc4_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC4' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_fifty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3555; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffc5_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC5' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_fifty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3556; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffc6_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC6' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_fifty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3557; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffc7_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC7' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_fifty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3558; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffc8_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC8' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_fifty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3559; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffc9_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC9' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_sixty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3560; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffca_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFCA' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_sixty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3561; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffcb_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFCB' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_sixty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3562; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffcc_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFCC' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_sixty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3563; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffcd_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFCD' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_sixty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3564; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_access_key_pair_is_halfwidth_hangul_letter_ffce_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFCE' + "AccessKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_sixty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3565; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffcf_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFCF' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_sixty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3566; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffd0_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD0' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_sixty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3567; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffd1_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD1' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_sixty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3568; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_access_key_pair_is_halfwidth_hangul_letter_ffd2_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD2' + "AccessKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_sixty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3569; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffd3_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD3' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_seventy_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3570; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffd4_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD4' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_seventy_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3571; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffd5_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD5' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_seventy_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3572; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffd6_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD6' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_seventy_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3573; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffd6_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD6' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffd7_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD7' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_seventy_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3574; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_access_key_pair_is_halfwidth_hangul_letter_ffd8_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD8' + "AccessKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_seventy_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3575; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffd9_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD9' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_seventy_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3576; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_seventy_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3577; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_seventy_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3578; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_seventy_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3579; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_eighty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3580; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_eighty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3581; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_eighty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3582; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_eighty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3583; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_eighty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3584; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_eighty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3585; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_eighty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3586; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_eighty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3587; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_sixty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3662; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_sixty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3663; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_sixty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3664; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_sixty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3665; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_sixty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3666; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_sixty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3667; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_sixty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3668; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_sixty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3669; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_seventy_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3670; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_seventy_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3671; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_seventy_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3672; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_seventy_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3673; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_seventy_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3674; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_seventy_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3675; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_seventy_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3676; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_seventy_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3677; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_seventy_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3678; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_seventy_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3679; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_eighty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3680; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_eighty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3681; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_eighty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3682; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_eighty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3683; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_eighty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3684; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_eighty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3685; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_eighty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3686; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_eighty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3687; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_eighty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3688; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_eighty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3689; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_ninety_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3690; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_ninety_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3691; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_ninety_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3692; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_ninety_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3693; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_ninety_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3694; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_ninety_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3695; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_ninety_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3696; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_ninety_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3697; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_ninety_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3698; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_ninety_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3699; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3700; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3701; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3702; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3703; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3704; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3705; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3706; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3707; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3708; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3709; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_ten_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3710; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_eleven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3711; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_twelve_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3712; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_thirteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3713; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_fourteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3714; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_fifteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3715; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_sixteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3716; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_seventeen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3717; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_eighteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3718; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_nineteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3719; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_twenty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3720; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_twenty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3721; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_twenty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3722; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_twenty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3723; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_twenty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3724; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_twenty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3725; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_twenty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3726; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_twenty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3727; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_twenty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3728; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_twenty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3729; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_thirty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3730; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_thirty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3731; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_thirty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3732; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_thirty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3733; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_thirty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3734; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_thirty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3735; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_thirty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3736; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_thirty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3737; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_thirty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3738; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_thirty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3739; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_forty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3740; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_forty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3741; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_forty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3742; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_forty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3743; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_forty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3744; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_forty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3745; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_forty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3746; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_forty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3747; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_forty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3748; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_forty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3749; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_fifty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3750; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_fifty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3751; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_fifty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3752; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_fifty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3753; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_fifty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3754; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_fifty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3755; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_fifty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3756; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_fifty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3757; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_fifty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3758; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_fifty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3759; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_sixty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3760; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_eight_hundred_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3801; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_eight_hundred_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3802; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_eight_hundred_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3803; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_eight_hundred_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3804; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_eight_hundred_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3805; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_eight_hundred_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3806; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_eight_hundred_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3800; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_ninety_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3799; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_ninety_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3798; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_ninety_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3797; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_ninety_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3796; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_ninety_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3795; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_ninety_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3794; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_ninety_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3793; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_ninety_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3792; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_ninety_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3791; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_ninety_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3790; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_eighty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3789; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_eighty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3788; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_eighty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3787; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_eighty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3786; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_eighty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3785; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_eighty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3784; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_eighty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3783; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_eighty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3782; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_eighty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3781; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_eighty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3780; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_seventy_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3779; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_seventy_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3778; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_seventy_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3777; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_seventy_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3776; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_seventy_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3775; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_seventy_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3774; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_seventy_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3773; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_seventy_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3772; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_seventy_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3771; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_seventy_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3770; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_sixty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3769; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_sixty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3768; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_sixty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3767; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_sixty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3766; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_sixty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3765; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_sixty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3764; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_sixty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3763; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_sixty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3762; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_seven_hundred_sixty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3761; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffa0_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA0' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffa1_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA1' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffa0_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA0' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffa2_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA2' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffa4_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA4' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffa5_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA5' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffa6_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA6' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffa8_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA8' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffaa_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAA' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffac_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAC' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffad_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAD' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffae_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAE' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffaf_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAF' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffa0_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA0' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffa1_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA1' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffa2_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA2' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffa3_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA3' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffa4_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA4' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffa5_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA5' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffa6_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA6' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffa7_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA7' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffa8_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA8' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffa9_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFA9' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffaa_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAA' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffab_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAB' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffac_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAC' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffad_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAD' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffae_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAE' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffaf_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFAF' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffb0_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB0' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffb1_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB1' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffb2_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB2' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffb3_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB3' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffb4_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB4' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffb5_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB5' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffb6_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB6' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffb7_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB7' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffb8_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB8' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffb9_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFB9' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffba_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFBA' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffc1_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC1' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_sixty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3661; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_sixty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3660; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffc3_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC3' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_fifty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3659; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffc4_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC4' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_fifty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3658; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffc5_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC5' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_fifty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3657; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffc6_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC6' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_fifty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3656; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_fifty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3655; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffc8_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC8' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_fifty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3654; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffc9_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFC9' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_fifty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3653; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffca_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFCA' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_fifty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3652; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffcb_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFCB' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_fifty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3651; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_fifty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3650; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffcd_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFCD' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_forty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3649; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffce_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFCE' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_forty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3648; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffcf_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFCF' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_forty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3647; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffd0_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD0' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_forty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3646; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffd1_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD1' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_forty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3645; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffd2_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD2' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_forty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3644; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_forty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3643; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_forty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3642; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_forty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3641; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_forty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3640; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_thirty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3639; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_thirty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3638; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_thirty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3637; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_thirty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3636; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_thirty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3635; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_thirty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3634; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_thirty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3633; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_thirty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3632; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_thirty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3631; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_thirty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3630; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_twenty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3629; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_twenty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3628; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_twenty_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3627; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_twenty_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3626; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_twenty_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3625; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_twenty_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3624; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_twenty_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3623; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_twenty_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3622; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_twenty_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3621; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_twenty_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3620; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_nineteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3619; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_eighteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3618; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_seventeen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3617; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_sixteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3616; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_fifteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3615; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_fourteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3614; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_thirteen_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3613; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_twelve_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3612; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_eleven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3611; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_ten_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3610; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3609; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3608; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3607; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3606; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3605; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3604; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3603; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3602; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3601; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_six_hundred_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3600; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_ninety_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3599; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_ninety_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3598; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_ninety_seven_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3597; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_ninety_six_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3596; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_ninety_five_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3595; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_ninety_four_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3594; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_ninety_three_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3593; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_ninety_two_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3592; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_ninety_one_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3591; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_ninety_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3590; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_eighty_nine_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3589; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_three_thousand_five_hundred_eighty_eight_layer_percent_encoded_in_query()
    {
        string encodedEquals = Uri.EscapeDataString("=");
        for (int layer = 1; layer < 3588; layer++)
            encodedEquals = Uri.EscapeDataString(encodedEquals);

        string effectiveValue = "redirect=https://x?ClientSecret" + encodedEquals + "abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_fffc_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFC' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_fffb_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFB' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_fffa_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFA' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffd7_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD7' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffd8_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD8' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffd9_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFD9' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffda_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFDA' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffdb_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFDB' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffdc_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFDC' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffdd_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFDD' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffde_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFDE' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffdf_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFDF' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffe0_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE0' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffe1_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE1' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffe2_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE2' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffe3_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE3' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffe4_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE4' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffe5_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE5' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffe6_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE6' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffe7_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE7' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffe8_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE8' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffe9_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFE9' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffea_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFEA' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffeb_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFEB' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_ffec_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFEC' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffed_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFED' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_ffee_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFEE' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_ffef_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFEF' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_fff0_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFF0' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_fff1_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFF1' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_fff2_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFF2' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_fff3_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFF3' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_fff4_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFF4' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_fff5_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFF5' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_fff6_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFF6' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_fff7_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFF7' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_fff8_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFF8' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_fff9_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFF9' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_ffff_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFF' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_fffe_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFE' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_fffd_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFD' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_fffd_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFD' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_fffc_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFC' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_access_key_pair_is_halfwidth_hangul_letter_fffb_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFB' + "AccessKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_fffa_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFA' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_client_secret_pair_is_halfwidth_hangul_letter_fff9_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFF9' + "ClientSecret=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_fffd_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFD' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_hangul_letter_fffc_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFC' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_fffb_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFB' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_hangul_letter_fffc_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFC' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_hangul_letter_fffa_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFFA' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_chi_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF7D' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_ta_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF7C' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_so_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF7B' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_se_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF7A' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_su_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF79' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_si_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF78' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_sa_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF77' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_ko_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF76' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_ke_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF75' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_letter_ku_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF74' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_ki_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF73' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_letter_ka_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF72' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_letter_small_ka_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF71' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_hiragana_prolonged_sound_mark_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF70' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_small_tsu_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF6F' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_small_yo_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF6E' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_small_yu_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF6D' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_small_ya_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF6C' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_small_o_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF6B' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_small_e_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF6A' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_small_u_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF69' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_small_a_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF68' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_halfwidth_katakana_small_wo_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF67' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_halfwidth_katakana_wo_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF66' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_fullwidth_circumflex_accent_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFEC' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_fullwidth_macron_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFFED' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_halfwidth_katakana_middle_dot_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF65' + "Password=secret";
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
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_fourteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEBA' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_eighteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEBB' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_eleven_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEBC' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_fifteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEBD' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_nineteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEBE' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_twelve_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEBF' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_sixteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEC0' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_twenty_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEC1' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_thirteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEC2' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_seventeen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEC3' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_twenty_one_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEC4' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_fourteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEC5' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_eighteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEC6' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_twenty_two_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEC7' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_fifteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEC8' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_nineteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEC9' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_twenty_three_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFECA' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_sixteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFECB' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_twenty_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFECC' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_twenty_four_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFECD' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_seventeen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFECE' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_twenty_one_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFECF' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_twenty_five_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFED0' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_eighteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFED1' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_twenty_two_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFED2' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_twenty_six_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFED3' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_nineteen_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFED4' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_twenty_three_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFED5' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_twenty_seven_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFED6' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_twenty_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFED7' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_twenty_four_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFED8' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_twenty_eight_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFED9' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_twenty_one_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEDA' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_twenty_five_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEDB' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_twenty_nine_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEDC' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_twenty_two_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEDD' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_twenty_six_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEDE' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_thirty_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEDF' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_twenty_three_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEE0' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_twenty_seven_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEE1' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_thirty_one_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEE2' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_twenty_four_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEE3' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_twenty_eight_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEE4' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_thirty_two_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEE5' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_twenty_five_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEE6' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_twenty_nine_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEE7' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_thirty_three_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEE8' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_twenty_six_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEE9' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_thirty_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEEA' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_thirty_four_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEEB' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_twenty_seven_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEEC' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_thirty_one_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEED' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_thirty_five_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEEE' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_twenty_eight_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEEF' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_thirty_two_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEF0' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_thirty_six_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEF1' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_twenty_nine_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEF2' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_thirty_three_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEF3' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_thirty_seven_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEF4' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_thirty_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEF5' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_thirty_four_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEF6' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_thirty_eight_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEF7' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_thirty_nine_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEF8' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_forty_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEF9' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_forty_one_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEFA' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_forty_two_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEFB' + "Token=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_api_key_pair_is_arabic_teh_marbuta_medial_form_forty_three_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEFC' + "ApiKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_password_pair_is_arabic_teh_marbuta_final_form_forty_four_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEFD' + "Password=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_arabic_teh_marbuta_isolated_form_forty_five_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFEFE' + "Token=secret";
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
    public void Resolve_redacts_embedded_credential_material_when_token_pair_is_fullwidth_reverse_solidus_delimited()
    {
        string effectiveValue = "Server=prod" + '\uFF3C' + "Token=secret";
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

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_odbc_style_uid_and_pwd_pairs_are_semicolon_delimited()
    {
        const string effectiveValue = "UID=app;PWD=secret;Server=db.example.com";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_blob_https_url_contains_sig_query_parameter()
    {
        const string effectiveValue = "https://acct.blob.core.windows.net/c?sig=abc&se=2030";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_postgresql_style_user_id_and_password_pairs_use_semicolon_delimiters()
    {
        const string effectiveValue = "Host=db;User ID=u;Password=p";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_mysql_style_uid_and_pwd_pairs_are_semicolon_delimited()
    {
        const string effectiveValue = "Server=mysql;Uid=u;Pwd=p;";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_azure_storage_connection_string_contains_account_key_pair()
    {
        const string effectiveValue = "DefaultEndpointsProtocol=https;AccountName=x;AccountKey=y;EndpointSuffix=core.windows.net";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_single_line_aws_secret_access_key_env_pair_is_pasted()
    {
        const string effectiveValue = "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_multiline_env_paste_contains_aws_secret_access_key()
    {
        const string effectiveValue = "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_my_password_env_style_key_uses_underscore_delimiter()
    {
        const string effectiveValue = "MY_PASSWORD=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_blob_url_uses_shared_access_signature_query_parameter()
    {
        const string effectiveValue = "https://acct.blob.core.windows.net/c?SharedAccessSignature=abc&se=2030";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_mongodb_srv_uri_contains_userinfo_credentials()
    {
        const string effectiveValue = "mongodb+srv://user:pass@cluster.mongodb.net/";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_oauth_token_url_contains_client_secret_query_pair()
    {
        const string effectiveValue = "https://login.example.com/token?client_id=a&client_secret=b";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_service_bus_connection_string_contains_shared_access_key_pair()
    {
        const string effectiveValue =
            "Endpoint=sb://ns.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_event_hub_connection_string_contains_shared_access_key_pair()
    {
        const string effectiveValue = "Endpoint=sb://ns.servicebus.windows.net/;SharedAccessKey=secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_jdbc_postgresql_url_contains_password_query_parameter()
    {
        const string effectiveValue = "jdbc:postgresql://host:5432/db?user=u&password=p";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_amqps_uri_contains_userinfo_credentials()
    {
        const string effectiveValue = "amqps://user:pass@broker.example.com:5671/vhost";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_table_storage_sas_url_contains_sig_query_parameter()
    {
        const string effectiveValue = "https://acct.table.core.windows.net/t?sv=2021&sig=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_property_names_use_camel_case_client_secret()
    {
        const string configPath = "ArchLucid:SomeFeature:Settings";
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [configPath] = """{"tenantId":"x","clientId":"y","clientSecret":"z"}""",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, configPath, isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_truncates_long_key_vault_reference_on_non_sensitive_path_without_malformed_surrogates()
    {
        const string configPath = "ArchLucid:SomeFeature:Settings";
        string vaultUri = new string('a', 240) + ".vault.azure.net/secrets/name/version";
        string effectiveValue = "@Microsoft.KeyVault(SecretUri=https://" + vaultUri + ")";
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [configPath] = effectiveValue,
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, configPath, isSet: true);

        value.Should().NotBe("***");
        value.Should().EndWith("…");
        value!.Length.Should().BeLessThanOrEqualTo(257);
        char.IsSurrogate(value[^2]).Should().BeFalse("truncation must not end on a high surrogate");
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_azure_sql_connection_string_contains_password_pair()
    {
        const string effectiveValue =
            "Server=tcp:sql.database.windows.net;Authentication=Active Directory Password;User ID=u;Password=p";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_ado_net_user_id_spelling_uses_space_before_id()
    {
        const string effectiveValue = "Server=.;User Id=sa;Password=secret;";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_scalar_is_raw_github_pat_without_key_pair()
    {
        const string effectiveValue = "ghp_abcdefghijklmnopqrstuvwxyz1234567890";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_blob_sas_query_omits_sig_parameter()
    {
        const string effectiveValue = "https://acct.blob.core.windows.net/c?se=2030&sp=r";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_jwt_bearer_signing_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Authentication:JwtBearer:SigningKey"] = "super-secret",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Authentication:JwtBearer:SigningKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_http_header_paste_uses_x_api_key_colon_delimiter()
    {
        const string effectiveValue = "X-Api-Key: secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_basic_header_contains_base64_userinfo()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_storage_connection_string_has_account_name_only()
    {
        const string effectiveValue = "DefaultEndpointsProtocol=https;AccountName=x;EndpointSuffix=core.windows.net";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_antiforgery_token_pair_ends_with_token_key_name()
    {
        const string effectiveValue = "AntiForgeryToken=abc";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_table_sas_query_omits_sig_parameter()
    {
        const string effectiveValue = "https://acct.table.core.windows.net/t?se=2030&sp=r";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_http_header_paste_uses_api_key_without_hyphen_colon_delimiter()
    {
        const string effectiveValue = "ApiKey: secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_bearer_header_contains_jwt()
    {
        const string effectiveValue = "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.e30.secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_basic_header_is_double_base64_encoded()
    {
        string onceEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("user:pass"));
        string doubleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(onceEncoded));
        string effectiveValue = $"Authorization: Basic {doubleEncoded}";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_authorization_basic_header_has_invalid_base64()
    {
        const string effectiveValue = "Authorization: Basic not!!!base64";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_utf8_bom_prefixes_client_secret_property()
    {
        const string effectiveValue = "\uFEFF{\"clientSecret\":\"z\"}";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_digest_header_contains_response_parameter()
    {
        const string effectiveValue = "Authorization: Digest username=\"u\", response=\"deadbeef\"";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_authorization_bearer_token_is_shorter_than_eight_characters()
    {
        const string effectiveValue = "Authorization: Bearer abc";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_basic_header_is_triple_base64_encoded()
    {
        string onceEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("user:pass"));
        string twiceEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(onceEncoded));
        string tripleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(twiceEncoded));
        string effectiveValue = $"Authorization: Basic {tripleEncoded}";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_bom_prefixes_json_array_with_password_property()
    {
        const string effectiveValue = "\uFEFF[{\"password\":\"x\"}]";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_header_contains_base64_userinfo()
    {
        const string effectiveValue = "Proxy-Authorization: Basic dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_negotiate_header_contains_spnego_blob()
    {
        const string effectiveValue = "Authorization: Negotiate YIIeAYeAABQAAAABAAA=";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_digest_header_uses_response_without_equals()
    {
        const string effectiveValue = "Authorization: Digest response=\"abc12345\"";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_basic_header_is_quadruple_base64_encoded()
    {
        string onceEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("user:pass"));
        string twiceEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(onceEncoded));
        string tripleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(twiceEncoded));
        string quadrupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(tripleEncoded));
        string effectiveValue = $"Authorization: Basic {quadrupleEncoded}";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_www_authenticate_basic_challenge_has_no_credentials()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=\"x\"";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_header_paste_contains_session_value()
    {
        const string effectiveValue = "Set-Cookie: session=abc123456789; HttpOnly";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_ntlm_header_contains_blob()
    {
        const string effectiveValue = "Authorization: NTLM TlRMTVNTUAABAAAABlIAA=";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_set_cookie_value_is_shorter_than_eight_characters()
    {
        const string effectiveValue = "Set-Cookie: s=abc";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_basic_header_is_quintuple_base64_encoded()
    {
        string onceEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("user:pass"));
        string twiceEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(onceEncoded));
        string tripleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(twiceEncoded));
        string quadrupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(tripleEncoded));
        string quintupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(quadrupleEncoded));
        string effectiveValue = $"Authorization: Basic {quintupleEncoded}";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_header_paste_contains_session_value()
    {
        const string effectiveValue = "Cookie: session=longvalue123456";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_digest_response_value_is_shorter_than_four_characters()
    {
        const string effectiveValue = "Authorization: Digest response=\"abc\"";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_bearer_jwt_paste_omits_authorization_prefix()
    {
        const string effectiveValue = "Bearer eyJhbGciOiJIUzI1NiJ9.e30.secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_basic_header_decodes_to_hex_without_userinfo()
    {
        string hexOnly = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("636c69656e74736563726574"));
        string effectiveValue = $"Authorization: Basic {hexOnly}";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_basic_header_is_sextuple_base64_encoded()
    {
        string onceEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("user:pass"));
        string twiceEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(onceEncoded));
        string tripleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(twiceEncoded));
        string quadrupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(tripleEncoded));
        string quintupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(quadrupleEncoded));
        string sextupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(quintupleEncoded));
        string effectiveValue = $"Authorization: Basic {sextupleEncoded}";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_header_lists_short_cookie_before_long_session()
    {
        const string effectiveValue = "Cookie: a=1; session=longsecret123456";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_header_paste_contains_session_value()
    {
        const string effectiveValue = "Set-Cookie2: session=longsecret123456";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_basic_header_is_septuple_base64_encoded()
    {
        string onceEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("user:pass"));
        string twiceEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(onceEncoded));
        string tripleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(twiceEncoded));
        string quadrupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(tripleEncoded));
        string quintupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(quadrupleEncoded));
        string sextupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(quintupleEncoded));
        string septupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(sextupleEncoded));
        string effectiveValue = $"Authorization: Basic {septupleEncoded}";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_header_lists_short_cookie_before_long_session_separated_by_comma()
    {
        const string effectiveValue = "Cookie: a=1, session=longsecret123456";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_header_uses_lowercase_bearer_scheme()
    {
        const string effectiveValue = "authorization: bearer eyJhbGciOiJIUzI1NiJ9.e30.secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_header_has_extra_whitespace_before_payload()
    {
        const string effectiveValue = "Authorization: Basic   dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_session_value_is_exactly_eight_characters()
    {
        const string effectiveValue = "Set-Cookie: session=12345678";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_basic_header_is_octuple_base64_encoded()
    {
        string onceEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("user:pass"));
        string twiceEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(onceEncoded));
        string tripleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(twiceEncoded));
        string quadrupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(tripleEncoded));
        string quintupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(quadrupleEncoded));
        string sextupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(quintupleEncoded));
        string septupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(sextupleEncoded));
        string octupleEncoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(septupleEncoded));
        string effectiveValue = $"Authorization: Basic {octupleEncoded}";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_session_value_is_followed_by_path_attribute()
    {
        const string effectiveValue = "Set-Cookie: session=longsecret123456; Path=/";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_bearer_token_is_followed_by_trailing_newline()
    {
        const string effectiveValue = "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.e30.secret\n";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_header_lists_short_cookie_before_long_session_separated_by_tab()
    {
        const string effectiveValue = "Cookie: a=1\tsession=longsecret123456";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_set_cookie_session_value_is_shorter_than_eight_characters()
    {
        const string effectiveValue = "Set-Cookie: session=1234567";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_embeds_connection_string_password_pair()
    {
        const string effectiveValue = """{"note":"Server=x;Password=secret"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_bearer_token_contains_internal_line_break()
    {
        const string effectiveValue = "Authorization: Bearer eyJhbG\nCiOiJIUzI1NiJ9.e30.secret";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_header_lists_short_cookie_before_long_session_separated_by_vertical_tab()
    {
        const string effectiveValue = "Cookie: a=1\u000Bsession=longsecret123456";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_json_array_contains_client_secret_property()
    {
        const string effectiveValue = """[{"ClientSecret":"z"}]""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_bearer_scheme_is_followed_by_whitespace_only()
    {
        const string effectiveValue = "Authorization: Bearer    ";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_header_lists_short_cookie_before_long_session_separated_by_form_feed()
    {
        const string effectiveValue = "Cookie: a=1\u000Csession=longsecret123456";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_contains_url_userinfo()
    {
        const string effectiveValue = """{"url":"https://user:pass@host"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_basic_header_has_newline_after_scheme()
    {
        const string effectiveValue = "Authorization: Basic\ndXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_lists_theme_before_long_session_attribute()
    {
        const string effectiveValue = "Set-Cookie: theme=dark; session=longsecret123456";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_has_newline_after_scheme()
    {
        const string effectiveValue = "Proxy-Authorization: Basic\ndXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_contains_internal_line_break()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXN\nX";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_header_lists_short_id_before_long_session_separated_by_form_feed()
    {
        const string effectiveValue = "Cookie: id=1\u000Csession=longsecret123456";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_digest_header_has_newline_after_scheme()
    {
        const string effectiveValue = "Authorization: Digest\nusername=\"u\", response=\"deadbeef\"";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_authorization_basic_has_carriage_return_after_scheme()
    {
        const string effectiveValue = "Authorization: Basic\rdXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_digest_has_newline_after_scheme()
    {
        const string effectiveValue = "Proxy-Authorization: Digest\nresponse=deadbeef0123";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_has_interior_spaces_before_line_wrap()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpw YXN\n";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_negotiate_header_has_newline_after_scheme()
    {
        const string effectiveValue = "Authorization: Negotiate\nYWRtaW46cGFzcw==";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_header_lists_short_x_before_eight_char_s_separated_by_form_feed()
    {
        const string effectiveValue = "Cookie: x=ab\u000Cs=12345678";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_digest_response_parameter_starts_on_following_line()
    {
        const string effectiveValue = "Authorization: Digest username=\"u\"\nresponse=deadbeef0123";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_ntlm_header_has_newline_after_scheme()
    {
        const string effectiveValue = "Authorization: NTLM\nTlRMTVNTUAABAAA";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_missing_base64_padding_character()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXM";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_bearer_header_has_newline_after_scheme()
    {
        const string effectiveValue = "Authorization: Bearer\neyJhbGciOiJIUzI1NiJ9";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_header_lists_short_a_before_long_s_separated_by_form_feed()
    {
        const string effectiveValue = "Cookie: a=1\u000Cs=123456789";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_negotiate_token_contains_internal_line_break()
    {
        const string effectiveValue = "Authorization: Negotiate YWRtaW\n46cGFzcw==";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_bearer_has_newline_after_scheme()
    {
        const string effectiveValue = "Proxy-Authorization: Bearer\neyJhbGciOiJIUzI1NiJ9";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_ntlm_token_contains_internal_line_break()
    {
        const string effectiveValue = "Authorization: NTLM TlRMTV\nNTUAABAAA";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_bearer_scheme_is_followed_by_tabs_only()
    {
        const string effectiveValue = "Authorization: Bearer\t\t";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_header_lists_short_z_before_ten_char_s_separated_by_form_feed()
    {
        const string effectiveValue = "Cookie: z=1\u000Cs=1234567890";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_uses_tab_separated_base64_chunks()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpw\tYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_ntlm_has_newline_after_scheme()
    {
        const string effectiveValue = "Proxy-Authorization: NTLM\nTlRMTVNTUAABAAA";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_digest_header_has_tab_after_scheme()
    {
        const string effectiveValue = "Authorization: Digest\tresponse=deadbeef0123";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_header_lists_short_a_before_seven_char_s_separated_by_form_feed()
    {
        const string effectiveValue = "Cookie: a=1\u000Cs=1234567";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_bearer_header_has_carriage_return_after_scheme()
    {
        const string effectiveValue = "Authorization: Bearer\reyJhbGciOiJIUzI1NiJ9";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_uses_form_feed_separated_base64_chunks()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpw\u000CYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_digest_has_tab_after_scheme()
    {
        const string effectiveValue = "Proxy-Authorization: Digest\tresponse=deadbeef0123";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_negotiate_header_has_carriage_return_after_scheme()
    {
        const string effectiveValue = "Authorization: Negotiate\rYWRtaW46cGFzcw==";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_header_lists_short_q_before_nine_char_r_separated_by_form_feed()
    {
        const string effectiveValue = "Cookie: q=1\u000Cr=123456789";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_uses_vertical_tab_separated_base64_chunks()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpw\u000BYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_bearer_header_has_form_feed_after_scheme()
    {
        const string effectiveValue = "Authorization: Bearer\u000CeyJhbGciOiJIUzI1NiJ9";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_negotiate_has_newline_after_scheme()
    {
        const string effectiveValue = "Proxy-Authorization: Negotiate\nYWRtaW46cGFzcw==";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_digest_header_has_form_feed_after_scheme()
    {
        const string effectiveValue = "Authorization: Digest\u000Cresponse=deadbeef0123";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_header_lists_short_m_before_ten_char_n_separated_by_form_feed()
    {
        const string effectiveValue = "Cookie: m=1\u000Cn=1234567890";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_ntlm_header_has_form_feed_after_scheme()
    {
        const string effectiveValue = "Authorization: NTLM\u000CTlRMTVNTUAABAAA";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_has_newline_after_interior_space()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpw\nYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_contains_trailing_base64_userinfo()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=\"app\", dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_session_value_is_exactly_eight_characters()
    {
        const string effectiveValue = "Set-Cookie2: session=12345678";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_bearer_token_uses_url_safe_alphabet_without_padding()
    {
        const string effectiveValue = "Authorization: Bearer eyJhbGciOiJIUzI1NiIs.eyJzdWIiOiJ1In0";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_contains_zero_width_space()
    {
        const string effectiveValue = "Authorization: Basic dXNl\u200BcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_proxy_authorization_basic_header()
    {
        const string effectiveValue = """{"hdr":"Proxy-Authorization: Basic dXNlcjpwYXNz"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_realm_quotes_contain_base64_userinfo()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=\"dXNlcjpwYXNz\"";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_has_byte_order_mark_prefix()
    {
        const string effectiveValue = "Authorization: Basic \uFEFFdXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_set_cookie2_session_value_is_shorter_than_eight_characters()
    {
        const string effectiveValue = "Set-Cookie2: session=1234567";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_digest_challenge_contains_response_fragment()
    {
        const string effectiveValue = "WWW-Authenticate: Digest realm=\"app\", response=\"deadbeef0123\"";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_basic_paste_with_zero_width_space()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNl\u200BcjpwYXNz"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_realm_single_quotes_contain_base64_userinfo()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm='dXNlcjpwYXNz'";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_semicolon_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz;other=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_digest_challenge_has_unquoted_response()
    {
        const string effectiveValue = "WWW-Authenticate: Digest response=deadbeef0123";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_basic_paste_with_byte_order_mark()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic \uFEFFdXNlcjpwYXNz"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_realm_backticks_contain_base64_userinfo()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=`dXNlcjpwYXNz`";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_closing_parenthesis()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz)";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_compound_list_has_eight_character_session()
    {
        const string effectiveValue = "Set-Cookie2: a=1; session=12345678";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_digest_response_uses_single_quotes()
    {
        const string effectiveValue = "WWW-Authenticate: Digest response='deadbeef0123'";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_json_array_wraps_basic_header_paste()
    {
        const string effectiveValue = """[{"hdr":"Authorization: Basic dXNlcjpwYXNz"}]""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_realm_angle_brackets_contain_base64_userinfo()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=<dXNlcjpwYXNz>";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_closing_bracket()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz]";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_compound_list_has_eight_character_session()
    {
        const string effectiveValue = "Cookie: a=1; session=12345678";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_digest_response_uses_backticks()
    {
        const string effectiveValue = "WWW-Authenticate: Digest response=`deadbeef0123`";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_nested_json_array_wraps_basic_header_paste()
    {
        const string effectiveValue = """{"items":[{"hdr":"Authorization: Basic dXNlcjpwYXNz"}]}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_realm_curly_braces_contain_base64_userinfo()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm={dXNlcjpwYXNz}";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_closing_brace()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz}";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_compound_list_has_eight_character_session()
    {
        const string effectiveValue = "Set-Cookie: a=1; session=12345678";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_digest_response_uses_angle_brackets()
    {
        const string effectiveValue = "WWW-Authenticate: Digest response=<deadbeef0123>";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_deeply_nested_json_wraps_basic_header_paste()
    {
        const string effectiveValue = """{"outer":{"items":[{"hdr":"Authorization: Basic dXNlcjpwYXNz"}]}}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_realm_square_brackets_contain_base64_userinfo()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=[dXNlcjpwYXNz]";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_pipe_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz|other=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_compound_list_has_eight_character_session_before_httponly()
    {
        const string effectiveValue = "Cookie: a=1; session=12345678; HttpOnly";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_digest_response_uses_curly_braces()
    {
        const string effectiveValue = "WWW-Authenticate: Digest response={deadbeef0123}";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%22"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_realm_parentheses_contain_base64_userinfo()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=(dXNlcjpwYXNz)";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_ampersand_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz&other=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_compound_list_has_eight_character_session_before_secure()
    {
        const string effectiveValue = "Set-Cookie: a=1; session=12345678; Secure";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_digest_response_uses_square_brackets()
    {
        const string effectiveValue = "WWW-Authenticate: Digest response=[deadbeef0123]";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_closing_brace_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%7D"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_realm_equals_unquoted_base64_userinfo()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=dXNlcjpwYXNz, charset=UTF-8";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_comma_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz,other=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie2_compound_list_has_eight_character_session()
    {
        const string effectiveValue = "Cookie2: a=1; session=12345678";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_digest_response_uses_parentheses()
    {
        const string effectiveValue = "WWW-Authenticate: Digest response=(deadbeef0123)";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_closing_bracket_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%5D"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_has_trailing_base64_after_quoted_realm()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=\"app\", dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_tab_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\tother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_cookie_compound_list_has_eight_character_session_before_domain()
    {
        const string effectiveValue = "Cookie: a=1; session=12345678; Domain=example.com";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_realm_parentheses_contain_base64_userinfo()
    {
        const string effectiveValue = "Proxy-Authorization: Basic realm=(dXNlcjpwYXNz)";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_closing_parenthesis_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%29"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_vertical_tab_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\vother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_form_feed_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\fother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_carriage_return_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\rother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_line_feed_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\nother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_no_break_space_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u00a0other=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_narrow_no_break_space_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u202fother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_figure_space_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u2007other=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_thin_space_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u2009other=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_hair_space_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u200aother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_punctuation_space_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u2008other=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_medium_mathematical_space_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u205fother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_ideographic_space_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u3000other=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_zero_width_space_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u200bother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_zero_width_non_joiner_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u200cother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_zero_width_joiner_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u200dother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_byte_order_mark_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\ufeffother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_soft_hyphen_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u00adother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_mongolian_vowel_separator_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u180eother=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_word_joiner_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u2060other=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_line_separator_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u2028other=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_paragraph_separator_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u2029other=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_basic_payload_is_truncated_by_next_line_suffix()
    {
        const string effectiveValue = "Authorization: Basic dXNlcjpwYXNz\u0085other=value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_compound_list_has_eight_character_session_before_priority()
    {
        const string effectiveValue = "Set-Cookie2: a=1; session=12345678; Priority=High";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_tab_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%09"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_newline_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%0A"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_carriage_return_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%0D"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_form_feed_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%0C"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_vertical_tab_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%0B"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_null_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%00"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_backspace_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%08"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_compound_list_has_eight_character_session_before_priority()
    {
        const string effectiveValue = "Set-Cookie: a=1; session=12345678; Priority=High";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_space_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%20"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_compound_list_has_eight_character_session_before_partitioned()
    {
        const string effectiveValue = "Set-Cookie2: a=1; session=12345678; Partitioned";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_comma_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%2C"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_compound_list_has_eight_character_session_before_partitioned()
    {
        const string effectiveValue = "Set-Cookie: a=1; session=12345678; Partitioned";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_colon_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%3A"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_compound_list_has_eight_character_session_before_expires()
    {
        const string effectiveValue = "Set-Cookie2: a=1; session=12345678; Expires=Wed, 21 Oct 2026 07:28:00 GMT";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_at_sign_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%40"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_compound_list_has_eight_character_session_before_expires()
    {
        const string effectiveValue = "Set-Cookie: a=1; session=12345678; Expires=Wed, 21 Oct 2026 07:28:00 GMT";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_hash_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%23"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_compound_list_has_eight_character_session_before_max_age()
    {
        const string effectiveValue = "Set-Cookie2: a=1; session=12345678; Max-Age=3600";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_question_mark_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%3F"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_has_trailing_base64_after_unquoted_realm()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=app, dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_has_trailing_base64_after_semicolon_separated_realm()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=app; dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_has_trailing_base64_after_tab_separated_realm()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=app\tdXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_has_trailing_base64_after_pipe_separated_realm()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=app|dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_has_trailing_base64_after_ampersand_separated_realm()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=app&dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_has_trailing_base64_after_vertical_tab_separated_realm()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=app\vdXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_compound_list_has_eight_character_session_before_max_age()
    {
        const string effectiveValue = "Set-Cookie: a=1; session=12345678; Max-Age=3600";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_slash_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%2F"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_compound_list_has_eight_character_session_before_path()
    {
        const string effectiveValue = "Set-Cookie2: a=1; session=12345678; Path=/";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_realm_parameter_followed_by_comma_segment_base64()
    {
        const string effectiveValue = "Proxy-Authorization: Basic realm=app, dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_plus_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%2B"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_compound_list_has_eight_character_session_before_path()
    {
        const string effectiveValue = "Set-Cookie: a=1; session=12345678; Path=/";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_realm_double_quotes_contain_base64_userinfo()
    {
        const string effectiveValue = "Proxy-Authorization: Basic realm=\"dXNlcjpwYXNz\"";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_equals_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%3D"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_compound_list_has_eight_character_session_before_samesite()
    {
        const string effectiveValue = "Set-Cookie2: a=1; session=12345678; SameSite=Strict";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_compound_list_has_eight_character_session_before_samesite_none()
    {
        const string effectiveValue = "Set-Cookie2: a=1; session=12345678; SameSite=None";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_compound_list_has_eight_character_session_before_samesite_lax()
    {
        const string effectiveValue = "Set-Cookie2: a=1; session=12345678; SameSite=Lax";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_realm_single_quotes_contain_base64_userinfo()
    {
        const string effectiveValue = "Proxy-Authorization: Basic realm='dXNlcjpwYXNz'";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_ampersand_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%26"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_compound_list_has_eight_character_session_before_samesite()
    {
        const string effectiveValue = "Set-Cookie: a=1; session=12345678; SameSite=Strict";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_compound_list_has_eight_character_session_before_samesite_none()
    {
        const string effectiveValue = "Set-Cookie: a=1; session=12345678; SameSite=None";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_compound_list_has_eight_character_session_before_samesite_lax()
    {
        const string effectiveValue = "Set-Cookie: a=1; session=12345678; SameSite=Lax";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_realm_backticks_contain_base64_userinfo()
    {
        const string effectiveValue = "Proxy-Authorization: Basic realm=`dXNlcjpwYXNz`";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_semicolon_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%3B"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_has_trailing_base64_after_parenthesis_realm()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=(app), dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_compound_list_has_eight_character_session_before_secure()
    {
        const string effectiveValue = "Set-Cookie2: a=1; session=12345678; Secure";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_pipe_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%7C"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_has_trailing_base64_after_curly_brace_realm()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm={app}, dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_close_brace_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%7D"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_has_trailing_base64_after_square_bracket_realm()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=[app], dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_compound_list_has_eight_character_session_before_httponly()
    {
        const string effectiveValue = "Set-Cookie2: a=1; session=12345678; HttpOnly";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_realm_angle_brackets_contain_base64_userinfo()
    {
        const string effectiveValue = "Proxy-Authorization: Basic realm=<dXNlcjpwYXNz>";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_open_brace_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%7B"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_has_trailing_base64_after_angle_bracket_realm()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=<app>, dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_compound_list_has_eight_character_session_before_httponly()
    {
        const string effectiveValue = "Set-Cookie: a=1; session=12345678; HttpOnly";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_realm_curly_braces_contain_base64_userinfo()
    {
        const string effectiveValue = "Proxy-Authorization: Basic realm={dXNlcjpwYXNz}";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_close_bracket_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%5D"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_has_trailing_base64_after_backtick_quoted_realm()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm=`app`, dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie2_compound_list_has_eight_character_session_before_domain()
    {
        const string effectiveValue = "Set-Cookie2: a=1; session=12345678; Domain=example.com";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_realm_unquoted_contains_base64_userinfo()
    {
        const string effectiveValue = "Proxy-Authorization: Basic realm=dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_realm_equals_whitespace_then_base64_userinfo()
    {
        const string effectiveValue = "Proxy-Authorization: Basic realm= dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_realm_empty_double_quotes_then_space_separated_base64()
    {
        const string effectiveValue = "Proxy-Authorization: Basic realm=\"\" dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_realm_empty_single_quotes_then_space_separated_base64()
    {
        const string effectiveValue = "Proxy-Authorization: Basic realm='' dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_realm_empty_backticks_then_space_separated_base64()
    {
        const string effectiveValue = "Proxy-Authorization: Basic realm=`` dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_open_bracket_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%5B"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_www_authenticate_basic_challenge_has_trailing_base64_after_single_quoted_realm()
    {
        const string effectiveValue = "WWW-Authenticate: Basic realm='app', dXNlcjpwYXNz";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_set_cookie_compound_list_has_eight_character_session_before_domain()
    {
        const string effectiveValue = "Set-Cookie: a=1; session=12345678; Domain=example.com";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_proxy_authorization_basic_realm_square_brackets_contain_base64_userinfo()
    {
        const string effectiveValue = "Proxy-Authorization: Basic realm=[dXNlcjpwYXNz]";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_json_effective_values_when_string_property_wraps_percent_encoded_open_parenthesis_on_basic_paste()
    {
        const string effectiveValue = """{"hdr":"Authorization: Basic dXNlcjpwYXNz%28"}""";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_sql_connection_string_contains_only_encrypt_flags()
    {
        const string effectiveValue = "Server=.;Encrypt=True;TrustServerCertificate=False";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_hostname_contains_pass_substring()
    {
        const string effectiveValue = "Server=pass-through.db.internal;Integrated Security=true";
        AssertPreserves(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_http_header_paste_uses_api_key_colon_delimiter()
    {
        const string effectiveValue = "Api-Key: secret-value";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_redacts_embedded_credential_material_when_blob_sas_url_contains_spr_and_sig_query_parameters()
    {
        const string effectiveValue = "https://acct.blob.core.windows.net/c?spr=https&sig=abc";
        AssertRedacts(effectiveValue);
    }

    [Fact]
    public void Resolve_returns_null_for_whitespace_only_effective_value_on_generic_config_path()
    {
        const string configPath = "ArchLucid:SomeFeature:Settings";
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [configPath] = "   ",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        ConfigurationEffectiveValueResolver.Resolve(configuration, configPath, isSet: true).Should().BeNull();
    }

    private static void AssertPreserves(string effectiveValue)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [ConfigPath] = effectiveValue,
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, ConfigPath, isSet: true);

        value.Should().Be(effectiveValue);
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

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_bearer_pair_uses_uppercase_key_name()
    {
        const string effectiveValue = "Server=prod;BEARER=abc";
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [ConfigPath] = effectiveValue,
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, ConfigPath, isSet: true);

        value.Should().Be(effectiveValue);
    }

    [Fact]
    public void Resolve_preserves_non_credential_effective_values_when_client_id_pair_uses_uppercase_key_name()
    {
        const string effectiveValue = "Server=prod;CLIENTID=abc";
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [ConfigPath] = effectiveValue,
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, ConfigPath, isSet: true);

        value.Should().Be(effectiveValue);
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
