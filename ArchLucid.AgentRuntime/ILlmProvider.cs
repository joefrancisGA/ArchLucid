namespace ArchLucid.AgentRuntime;

/// <summary>
/// Vendor-agnostic chat completion contract: JSON-oriented assistant output plus connection metadata (model, endpoint shape, auth scheme — no secrets).
/// </summary>
/// <remarks>
/// Agents, Ask, and explanations depend on <see cref="IAgentCompletionClient"/> (same surface). New vendor adapters implement
/// <see cref="ILlmProvider"/> / <see cref="IAgentCompletionClient"/> and register them in host composition instead of branching agent code.
/// </remarks>
public interface ILlmProvider
{
    /// <summary>Logical vendor, model/deployment id, optional API base URL, and auth scheme (credentials stay in configuration or SDK).</summary>
    LlmProviderDescriptor Descriptor
    {
        get;
    }

    /// <summary>
    /// Sends <paramref name="systemPrompt"/> and <paramref name="userPrompt"/> as chat messages and returns the assistant text.
    /// </summary>
    Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default);
}
