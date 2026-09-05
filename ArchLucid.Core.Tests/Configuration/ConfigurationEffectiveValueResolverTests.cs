using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;
[Trait("Category", "Unit")]

public sealed class ConfigurationEffectiveValueResolverTests
{
    [Fact]
    public void Resolve_returns_null_when_unset()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();

        string? v = ConfigurationEffectiveValueResolver.Resolve(configuration, "Missing:Key", isSet: false);

        v.Should().BeNull();
    }

    [Fact]
    public void Resolve_redacts_connection_strings()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ConnectionStrings:ArchLucid"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? v = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "ConnectionStrings:ArchLucid",
            isSet: true);

        v.Should().Be("***");
    }

    [Fact]
    public void Resolve_returns_scalar_when_not_sensitive()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucid:StorageProvider"] = "Sql"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? v = ConfigurationEffectiveValueResolver.Resolve(configuration, "ArchLucid:StorageProvider", isSet: true);

        v.Should().Be("Sql");
    }

    [Fact]
    public void Resolve_redacts_private_key_config_paths()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Trial:LocalIdentity:JwtPrivateKeyPemPath"] = "/secrets/jwt.pem"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Trial:LocalIdentity:JwtPrivateKeyPemPath",
            isSet: true);

        value.Should().Be("***");
    }

    [Theory]
    [InlineData("ArchLucid:Auth:ClientSecret")]
    [InlineData("Azure:Storage:PrimaryKey")]
    [InlineData("Azure:Storage:AccountKey")]
    public void Resolve_redacts_explicit_credential_config_paths(string configPath)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [configPath] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, configPath, isSet: true);

        value.Should().Be("***");
    }

    [Theory]
    [InlineData("ArchLucid:Auth:SigningCertificatePath", "/secrets/signing.pfx")]
    [InlineData("ArchLucid:Saml:SigningCertificate", "/secrets/signing.pfx")]
    public void Resolve_redacts_certificate_config_paths(string configPath, string secretValue)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [configPath] = secretValue
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, configPath, isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_signing_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucid:Auth:SigningKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "ArchLucid:Auth:SigningKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Theory]
    [InlineData("ArchLucid:PasswordlessAuth:Enabled", "true")]
    [InlineData("ArchLucid:TokenizerModel:Name", "gpt-4.1")]
    [InlineData("ArchLucid:ApiKeylessAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:ConnectionStringFreeSettings:Enabled", "true")]
    [InlineData("ArchLucid:ConnectionStringlessSettings:Enabled", "true")]
    [InlineData("ArchLucid:SecretizerModule:Name", "module-a")]
    [InlineData("ArchLucid:ApiKeyizerModule:Name", "module-a")]
    [InlineData("ArchLucid:ConnectionStringizerSettings:Enabled", "true")]
    [InlineData("ArchLucid:PasswordizerAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:PasswordFreeAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:SecretFreeStorage:Bucket", "logs")]
    [InlineData("ArchLucid:TokenFreeAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:TokenlessAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:ApiKeyFreeAuth:Mode", "managed-identity")]
    [InlineData("Features:NonSecretStorage:Bucket", "logs")]
    [InlineData("ArchLucid:PrivateKeylessAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:PrivateKeyizerModule:Name", "module-a")]
  public void Resolve_returns_scalar_for_non_secret_segment_substrings(string configPath, string expectedValue)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [configPath] = expectedValue
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? v = ConfigurationEffectiveValueResolver.Resolve(configuration, configPath, isSet: true);

        v.Should().Be(expectedValue);
    }
}
