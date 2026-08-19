using System.Reflection;

using ArchLucid.AgentRuntime;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>TB-193: factory must stay decoupled from a concrete Azure OpenAI client type.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LlmProviderFactoryDependencyTests
{
    [Fact]
    public void DefaultLlmProviderFactory_constructor_does_not_reference_AzureOpenAiCompletionClient()
    {
        IEnumerable<Type> parameterTypes = typeof(DefaultLlmProviderFactory)
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance)
            .SelectMany(static c => c.GetParameters())
            .Select(static p => p.ParameterType);

        parameterTypes.Should().Contain(typeof(IAgentCompletionClient));
        parameterTypes.Should().NotContain(typeof(AzureOpenAiCompletionClient));
        parameterTypes.Should().NotContain(typeof(CoreLlmAgentCompletionClientAdapter));
    }
}
