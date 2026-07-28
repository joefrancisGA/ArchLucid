using ArchLucid.AgentRuntime;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

/// <summary>Bridges runtime Azure client to Core.Llm for ArchitectureIntelligence gateway resolution.</summary>
internal sealed class LiveCoreLlmCompletionAdapter(AzureOpenAiCompletionClient inner)
    : ArchLucid.Core.Llm.IAgentCompletionClient
{
    public Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default) =>
        inner.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken);
}
