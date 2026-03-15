namespace ArchiForge.AgentRuntime;

public sealed class FakeAgentCompletionClient : IAgentCompletionClient
{
    private readonly Func<string, string, string> _resolver;

    public FakeAgentCompletionClient(Func<string, string, string> resolver)
    {
        _resolver = resolver;
    }

    public Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default)
    {
        var json = _resolver(systemPrompt, userPrompt);
        return Task.FromResult(json);
    }
}
