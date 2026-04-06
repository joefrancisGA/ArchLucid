using ArchLucid.AgentRuntime;

namespace ArchLucid.AgentRuntime.Tests;

public sealed class StubAgentCompletionClient(string json) : IAgentCompletionClient
{
    public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("stub", "stub");

    public Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(json);
    }
}
