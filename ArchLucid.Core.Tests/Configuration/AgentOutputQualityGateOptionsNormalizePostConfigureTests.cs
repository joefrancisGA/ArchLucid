using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Configuration")]
public sealed class AgentOutputQualityGateOptionsNormalizePostConfigureTests
{
    [Fact]
    public void PostConfigure_trims_per_agent_type_floors_keys_from_configuration_binding()
    {
        AgentOutputQualityGateOptions options = new()
        {
            PerAgentTypeFloors = new Dictionary<string, AgentTypeQualityFloors>(StringComparer.OrdinalIgnoreCase)
            {
                ["  Topology  "] = new AgentTypeQualityFloors { StructuralRejectBelow = 0.85 },
            },
        };

        new AgentOutputQualityGateOptionsNormalizePostConfigure().PostConfigure(Options.DefaultName, options);

        options.PerAgentTypeFloors.Should().ContainKey("Topology");
    }

    [Fact]
    public void Resolve_uses_per_agent_floors_when_config_bound_key_has_bounding_whitespace()
    {
        AgentOutputQualityGateOptions options = new()
        {
            StructuralRejectBelow = 0.7,
            PerAgentTypeFloors = new Dictionary<string, AgentTypeQualityFloors>(StringComparer.OrdinalIgnoreCase)
            {
                ["  Topology  "] = new AgentTypeQualityFloors { StructuralRejectBelow = 0.85 },
            },
        };

        new AgentOutputQualityGateOptionsNormalizePostConfigure().PostConfigure(Options.DefaultName, options);

        AgentOutputQualityGateEffectiveFloorsResolver.Resolve(options, AgentType.Topology).StructuralRejectBelow
            .Should()
            .Be(0.85);
    }
}
