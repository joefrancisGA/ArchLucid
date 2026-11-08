using ArchLucid.Core.Configuration.Summary;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConfigurationEmbeddedCredentialFastPathTests
{
    private const string ConfigPath = "ArchLucid:SomeFeature:Settings";

    [Theory]
    [InlineData(1, "3D")]
    [InlineData(2, "3D")]
    [InlineData(4096, "3D")]
    [InlineData(4096, "3A")]
    public void Resolve_redacts_repeatedly_percent_encoded_credential_separators(int layers, string separatorHex)
    {
        // The same nested form as repeated Uri.EscapeDataString, built linearly
        // so a regression test cannot spend minutes constructing its fixture.
        string encodedSeparator = "%" + string.Concat(Enumerable.Repeat("25", layers - 1)) + separatorHex;
        string value = "redirect=https://x?ClientSecret" + encodedSeparator + "secret";

        Resolve(value).Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_empty_credential_after_repeated_percent_encoding()
    {
        Resolve("redirect=https://x?ClientSecret%25253D").Should().Be("***");
    }

    [Theory]
    [InlineData("redirect=https://x?ClientSecret%25253Eabc")]
    [InlineData("redirect=https://x?ClientId%25253Dpublic")]
    [InlineData("redirect=https://x?notClientSecret%25253Dpublic")]
    public void Resolve_does_not_treat_unrelated_encoded_text_as_a_credential_pair(string value)
    {
        Resolve(value).Should().Be(value);
    }

    private static string? Resolve(string value)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { [ConfigPath] = value })
            .Build();

        return ConfigurationEffectiveValueResolver.Resolve(configuration, ConfigPath, isSet: true);
    }
}
