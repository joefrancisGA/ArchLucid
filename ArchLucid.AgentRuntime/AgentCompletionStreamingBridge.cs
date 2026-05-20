using System.Runtime.CompilerServices;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Resolves <see cref="IAgentStreamingCompletionClient" /> through decorator chains or falls back to buffered
///     completion with simulated chunking.
/// </summary>
public static class AgentCompletionStreamingBridge
{
    private const int SimulatedChunkSize = 48;

    /// <summary>
    ///     Streams JSON assistant output when the registered client (or its inner chain) supports streaming.
    /// </summary>
    public static async IAsyncEnumerable<string> StreamJsonAsync(
        IAgentCompletionClient client,
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrWhiteSpace(systemPrompt);
        ArgumentException.ThrowIfNullOrWhiteSpace(userPrompt);

        if (client is IAgentStreamingCompletionClient streamingClient)
        {
            await foreach (string chunk in streamingClient.StreamJsonAsync(
                               systemPrompt,
                               userPrompt,
                               maxTokens,
                               temperature,
                               cancellationToken).ConfigureAwait(false))
            {
                if (chunk.Length > 0)
                    yield return chunk;
            }

            yield break;
        }

        string full = await client.CompleteJsonAsync(
            systemPrompt,
            userPrompt,
            maxTokens,
            temperature,
            cancellationToken).ConfigureAwait(false);

        foreach (string chunk in SimulateChunks(full))
            yield return chunk;
    }

    internal static IEnumerable<string> SimulateChunks(string full)
    {
        if (string.IsNullOrEmpty(full))
            yield break;

        for (int i = 0; i < full.Length; i += SimulatedChunkSize)
            yield return full.Substring(i, Math.Min(SimulatedChunkSize, full.Length - i));
    }
}
