using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliCommandSharedGetBaseUrlTests
{
    [Fact]
    public void GetBaseUrl_uses_configured_api_base_url_when_present()
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig config = new()
        {
            ApiUrl = "https://api.example.com/",
        };

        CliCommandShared.GetBaseUrl(config).Should().Be("https://api.example.com");
    }

    [Fact]
    public void GetBaseUrl_returns_empty_when_config_is_null_and_env_unset()
    {
        string? prior = Environment.GetEnvironmentVariable("ARCHLUCID_API_URL");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", null);
            CliCommandShared.GetBaseUrl(null).Should().Be(string.Empty);
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", prior);
        }
    }
}
