using ArchLucid.Core.Llm;

namespace ArchLucid.AgentRuntime;

/// <summary>Bridges <see cref="IAgentCompletionClient" /> (runtime) to <see cref="Core.Llm.IAgentCompletionClient" /> for TB-193 factory.</summary>
internal sealed class CoreLlmAgentCompletionClientAdapter(IAgentCompletionClient inner) : Core.Llm.IAgentCompletionClient
{
    private readonly IAgentCompletionClient _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    public Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default) =>
        _inner.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken);
}
