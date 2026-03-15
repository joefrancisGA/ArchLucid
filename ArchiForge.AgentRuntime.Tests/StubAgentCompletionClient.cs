namespace ArchiForge.AgentRuntime.Tests;

public sealed class StubAgentCompletionClient : IAgentCompletionClient
{
    private readonly string _json;

    public StubAgentCompletionClient(string json)
    {
        _json = json;
    }

    public Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_json);
    }
}
