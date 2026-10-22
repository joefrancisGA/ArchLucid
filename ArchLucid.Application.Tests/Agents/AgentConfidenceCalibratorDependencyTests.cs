using System.Reflection;

using ArchLucid.Application.Agents;
using ArchLucid.AgentRuntime;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents;

/// <summary>TB-180: calibrator must not call back into LLM completion (circular judge-calibrator risk).</summary>
[Trait("Suite", "Core")]
public sealed class AgentConfidenceCalibratorDependencyTests
{
    [Fact]
    public void AgentConfidenceCalibrator_constructor_does_not_take_llm_completion_client()
    {
        IEnumerable<Type> parameterTypes = typeof(AgentConfidenceCalibrator)
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance)
            .SelectMany(static c => c.GetParameters())
            .Select(static p => p.ParameterType);

        parameterTypes.Should().NotContain(typeof(IAgentCompletionClient));
    }
}
