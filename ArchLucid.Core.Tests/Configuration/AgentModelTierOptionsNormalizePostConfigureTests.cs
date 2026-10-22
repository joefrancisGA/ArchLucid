using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Configuration")]
public sealed class AgentModelTierOptionsNormalizePostConfigureTests
{
    [Fact]
    public void PostConfigure_trims_agent_type_tier_map_keys_from_configuration_binding()
    {
        AgentModelTierOptions options = new()
        {
            AgentTypeTiers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["  Cost  "] = nameof(ArchLucid.Contracts.Common.LlmModelTier.Premium),
            },
        };

        new AgentModelTierOptionsNormalizePostConfigure().PostConfigure(Options.DefaultName, options);

        options.AgentTypeTiers.Should().ContainKey("Cost");
        options.AgentTypeTiers["Cost"].Should().Be(nameof(ArchLucid.Contracts.Common.LlmModelTier.Premium));
    }
}
