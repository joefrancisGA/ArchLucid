namespace ArchLucid.AgentRuntime.Tests;

public sealed class StubAgentCompletionClient(string json) : IAgentCompletionClient
{
    public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("stub", "stub");

    public Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(json);
    }
}
