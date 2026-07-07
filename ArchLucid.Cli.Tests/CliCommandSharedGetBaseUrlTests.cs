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
    public void GetBaseUrl_falls_back_to_localhost_when_config_is_null()
    {
        CliCommandShared.GetBaseUrl(null).Should().Contain("localhost");
    }
}
