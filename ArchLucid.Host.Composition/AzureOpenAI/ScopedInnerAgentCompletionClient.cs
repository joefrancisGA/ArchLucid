using ArchLucid.AgentRuntime;

namespace ArchLucid.Host.Composition.AzureOpenAI;

/// <summary>DI scope holder for the primary Azure OpenAI completion pipeline (fallback-aware).</summary>
internal sealed class ScopedInnerAgentCompletionClient(IAgentCompletionClient inner)
{
    public IAgentCompletionClient Inner { get; } =
        inner ?? throw new ArgumentNullException(nameof(inner));
}
