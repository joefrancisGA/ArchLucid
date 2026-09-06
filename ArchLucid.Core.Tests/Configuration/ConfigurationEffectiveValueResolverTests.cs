using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConfigurationEffectiveValueResolverTests
{
    [Fact]
    public void Resolve_returns_null_when_unset()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, "Missing:Key", isSet: false);

        value.Should().BeNull();
    }

    [Fact]
    public void Resolve_redacts_connection_strings()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ConnectionStrings:ArchLucid"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "ConnectionStrings:ArchLucid",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_returns_scalar_when_not_sensitive()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucid:StorageProvider"] = "Sql"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, "ArchLucid:StorageProvider", isSet: true);

        value.Should().Be("Sql");
    }

    [Theory]
    [InlineData("ArchLucid:AdminPassword")]
    [InlineData("ArchLucid:SqlAdminPassword")]
    [InlineData("ArchLucid:OpenAiApiKey")]
    [InlineData("ArchLucid:GraphClientSecret")]
    [InlineData("ArchLucid:Jwt:SigningKey")]
    [InlineData("ArchLucid:ServiceBus:SharedAccessKey")]
    [InlineData("ArchLucid:ClientCertificatePassword")]
    [InlineData("Trial:LocalIdentity:JwtPrivateKeyPemPath")]
    public void Resolve_redacts_realistic_sensitive_config_paths(string configPath)
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
    [InlineData("ArchLucid:PasswordlessAuth:Mode")]
    [InlineData("ArchLucid:Host:PublicBaseUrl")]
    [InlineData("ArchLucid:ApiKeyizerModule:Mode")]
    public void Resolve_returns_scalar_for_non_sensitive_config_paths(string configPath)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [configPath] = "enabled"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, configPath, isSet: true);

        value.Should().Be("enabled");
    }

    [Fact]
    public void Resolve_redacts_trailing_key_segment()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucid:Custom:Key"] = "secret-value"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, "ArchLucid:Custom:Key", isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_truncates_long_scalar_values()
    {
        string longValue = new string('a', 300);
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucid:StorageProvider"] = longValue
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, "ArchLucid:StorageProvider", isSet: true);

        value.Should().NotBeNull();
        value!.Length.Should().Be(257);
        value.Should().EndWith("…");
    }
}
