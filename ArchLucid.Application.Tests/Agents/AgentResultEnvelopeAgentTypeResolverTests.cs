using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentResultEnvelopeAgentTypeResolverTests
{
    [Fact]
    public void ResolveAgentType_uses_first_non_default_source_agent_when_envelope_type_missing()
    {
        AgentResult result = new()
        {
            AgentType = default,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = "f-cost",
                    SourceAgent = AgentType.Cost,
                },
                new ArchitectureFinding
                {
                    FindingId = "f-compliance",
                    SourceAgent = AgentType.Compliance,
                },
            ],
        };

        AgentType resolved = AgentResultEnvelopeAgentTypeResolver.ResolveAgentType(result);

        resolved.Should().Be(AgentType.Cost);
    }

    [Fact]
    public void EnsureFindingSourceAgents_preserves_explicit_source_agent_on_individual_findings()
    {
        AgentResult result = new()
        {
            AgentType = default,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = "f-cost",
                    SourceAgent = AgentType.Cost,
                },
                new ArchitectureFinding
                {
                    FindingId = "f-compliance",
                    SourceAgent = AgentType.Compliance,
                },
                new ArchitectureFinding
                {
                    FindingId = "f-untyped",
                    SourceAgent = default,
                },
            ],
        };

        AgentResultEnvelopeAgentTypeResolver.EnsureFindingSourceAgents(result);

        result.AgentType.Should().Be(AgentType.Cost);
        result.Findings![0].SourceAgent.Should().Be(AgentType.Cost);
        result.Findings[1].SourceAgent.Should().Be(AgentType.Compliance);
        result.Findings[2].SourceAgent.Should().Be(AgentType.Cost);
    }
}