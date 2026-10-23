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
