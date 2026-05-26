using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentOutputQualityGateEffectiveFloorsResolverTests
{
    [Fact]
    public void Resolve_applies_per_agent_overrides_on_top_of_global_floors()
    {
        AgentOutputQualityGateOptions options = new()
        {
            StructuralWarnBelow = 0.8,
            StructuralRejectBelow = 0.7,
            SemanticWarnBelow = 0.6,
            SemanticRejectBelow = 0.5,
            PerAgentTypeFloors =
            {
                ["Topology"] = new AgentTypeQualityFloors
                {
                    StructuralRejectBelow = 0.85,
                    SemanticRejectBelow = 0.65,
                },
            },
        };

        AgentOutputQualityGateEffectiveFloorsResolver.EffectiveFloors topology =
            AgentOutputQualityGateEffectiveFloorsResolver.Resolve(options, AgentType.Topology);

        topology.StructuralWarnBelow.Should().Be(0.8);
        topology.StructuralRejectBelow.Should().Be(0.85);
        topology.SemanticWarnBelow.Should().Be(0.6);
        topology.SemanticRejectBelow.Should().Be(0.65);

        AgentOutputQualityGateEffectiveFloorsResolver.EffectiveFloors cost =
            AgentOutputQualityGateEffectiveFloorsResolver.Resolve(options, AgentType.Cost);

        cost.StructuralRejectBelow.Should().Be(0.7);
        cost.SemanticRejectBelow.Should().Be(0.5);
    }
}
