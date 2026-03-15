namespace ArchiForge.AgentRuntime;

public interface IAgentCompletionClient
{
    Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default);
}
