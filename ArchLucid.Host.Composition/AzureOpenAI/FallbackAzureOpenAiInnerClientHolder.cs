using ArchLucid.AgentRuntime;

namespace ArchLucid.Host.Composition.AzureOpenAI;

/// <summary>Holds the fallback-region <see cref="AzureOpenAiCompletionClient" /> when <c>FallbackLlm</c> is enabled.</summary>
public sealed class FallbackAzureOpenAiInnerClientHolder(AzureOpenAiCompletionClient client)
{
    public AzureOpenAiCompletionClient Client
    {
        get;
    } = client ?? throw new ArgumentNullException(nameof(client));
}
