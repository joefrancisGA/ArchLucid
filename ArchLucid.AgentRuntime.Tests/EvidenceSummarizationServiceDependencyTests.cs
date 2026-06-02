using System.Reflection;

using ArchLucid.AgentRuntime;

using FluentAssertions;

using ArchLucid.AgentRuntime.Evaluation;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>TB-192: summarization must not depend on quality gate or faithfulness evaluators (circular risk).</summary>
[Trait("Suite", "Core")]
public sealed class EvidenceSummarizationServiceDependencyTests
{
    [Fact]
    public void EvidenceSummarizationService_constructor_only_uses_tier_router_for_llm_access()
    {
        IEnumerable<Type> parameterTypes = typeof(EvidenceSummarizationService)
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance)
            .SelectMany(static c => c.GetParameters())
            .Select(static p => p.ParameterType);

        parameterTypes.Should().Contain(typeof(IAgentTierCompletionRouter));
        parameterTypes.Should().NotContain(typeof(IAgentCompletionClient));
        parameterTypes.Should().NotContain(typeof(AgentOutputFaithfulnessEvaluator));
        parameterTypes.Should().NotContain(typeof(AgentOutputQualityGate));
    }
}
