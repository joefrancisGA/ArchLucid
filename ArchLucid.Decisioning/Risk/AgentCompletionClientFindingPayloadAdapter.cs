using ArchLucid.Core.Llm;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Decisioning.Risk;

public sealed class AgentCompletionClientFindingPayloadAdapter(IAgentCompletionClient innerClient)
    : IFindingPayloadJsonCompletionClient
{
    private readonly IAgentCompletionClient _innerClient =
        innerClient ?? throw new ArgumentNullException(nameof(innerClient));

    public Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken) =>
        _innerClient.CompleteJsonAsync(systemPrompt, userPrompt, cancellationToken: cancellationToken);
}
