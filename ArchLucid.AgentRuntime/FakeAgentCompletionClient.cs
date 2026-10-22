namespace ArchLucid.AgentRuntime;

using System.Runtime.CompilerServices;

/// <summary>
///     Deterministic <see cref="IAgentCompletionClient" /> for tests and local dev; delegates to a supplied prompt
///     resolver.
/// </summary>
public sealed class FakeAgentCompletionClient(
    Func<string, string, string> resolver,
    LlmProviderDescriptor? descriptor = null) : IAgentStreamingCompletionClient
{
    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor
    {
        get;
    } =
        descriptor ?? LlmProviderDescriptor.ForOffline("fake", "fake");

    /// <inheritdoc />
    public Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        string json = resolver(systemPrompt, userPrompt);
        return Task.FromResult(json);
    }

    /// <inheritdoc />
    public async IAsyncEnumerable<string> StreamJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        string json = await CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken)
            .ConfigureAwait(false);

        foreach (string chunk in AgentCompletionStreamingBridge.SimulateChunks(json))
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return chunk;
        }
    }
}
