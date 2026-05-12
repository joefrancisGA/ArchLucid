using ArchLucid.AgentRuntime;

namespace ArchLucid.Host.Composition.AzureOpenAI;

/// <summary>Holds one or more fallback-region <see cref="AzureOpenAiCompletionClient" /> instances when FallbackLlm is enabled.</summary>
public sealed class FallbackAzureOpenAiInnerClientsRegistry
{
    public required IReadOnlyList<AzureOpenAiCompletionClient> Clients
    {
        get;
        init;
    }
}
