using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.AgentRuntime.Prompts.Variants;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Prompts.Variants;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PromptTemplateNameResolverTests
{
    [Theory]
    [InlineData(AgentType.Topology, TopologySystemPromptTemplate.TemplateId)]
    [InlineData(AgentType.Compliance, ComplianceSystemPromptTemplate.TemplateId)]
    [InlineData(AgentType.Cost, CostSystemPromptTemplate.TemplateId)]
    [InlineData(AgentType.Critic, CriticSystemPromptTemplate.TemplateId)]
    public void FromAgentType_maps_known_agent_types(AgentType agentType, string expectedTemplateId)
    {
        string templateId = PromptTemplateNameResolver.FromAgentType(agentType);

        templateId.Should().Be(expectedTemplateId);
    }

    [Fact]
    public void FromAgentType_throws_for_unmapped_agent_type()
    {
        Action act = () => PromptTemplateNameResolver.FromAgentType((AgentType)999);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*no prompt template mapping*");
    }
}
