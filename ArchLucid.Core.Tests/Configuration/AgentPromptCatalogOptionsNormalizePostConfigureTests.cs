using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Configuration")]
public sealed class AgentPromptCatalogOptionsNormalizePostConfigureTests
{
    [Fact]
    public void PostConfigure_trims_agent_prompt_version_keys_from_configuration_binding()
    {
        AgentPromptCatalogOptions options = new()
        {
            Versions = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["  topology  "] = "  experiment-a  ",
            },
        };

        new AgentPromptCatalogOptionsNormalizePostConfigure().PostConfigure(Options.DefaultName, options);

        options.Versions.Should().ContainKey("topology");
        options.Versions["topology"].Should().Be("experiment-a");
    }
}
