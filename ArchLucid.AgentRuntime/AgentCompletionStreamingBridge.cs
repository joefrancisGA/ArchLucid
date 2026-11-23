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
        cancellationToken.ThrowIfCancellationRequested();

        if (client is IAgentStreamingCompletionClient streamingClient)
        {
            await foreach (string chunk in streamingClient.StreamJsonAsync(
                               systemPrompt,
                               userPrompt,
                               maxTokens,
                               temperature,
                               cancellationToken).ConfigureAwait(false))
            {
                // Enforce consumer cancellation even if a streaming provider ignores its token.
                cancellationToken.ThrowIfCancellationRequested();
                if (chunk.Length > 0)
                    yield return chunk;
            }

            // A non-cooperative provider may signal end-of-stream after the caller canceled.
            cancellationToken.ThrowIfCancellationRequested();
            yield break;
        }

        string full = await client.CompleteJsonAsync(
            systemPrompt,
            userPrompt,
            maxTokens,
            temperature,
            cancellationToken).ConfigureAwait(false);

        // A buffered completion might finish after the consumer canceled.
        cancellationToken.ThrowIfCancellationRequested();
        foreach (string chunk in SimulateChunks(full))
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return chunk;
        }
    }

    internal static IEnumerable<string> SimulateChunks(string full)
    {
        if (string.IsNullOrEmpty(full))
            yield break;

        for (int i = 0; i < full.Length; i += SimulatedChunkSize)
            yield return full.Substring(i, Math.Min(SimulatedChunkSize, full.Length - i));
    }
}
