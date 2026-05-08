using System.Collections.Concurrent;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Caches <see cref="AzureOpenAiCompletionClient" /> instances per deployment name for a single endpoint/key pair.
/// </summary>
public sealed class AzureOpenAiCompletionClientCache
{
    private readonly ConcurrentDictionary<string, AzureOpenAiCompletionClient> _clients =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly string _endpoint;
    private readonly string _apiKey;
    private readonly int _maxCompletionTokens;

    /// <summary>Creates a cache for the given Azure OpenAI resource credentials.</summary>
    public AzureOpenAiCompletionClientCache(string endpoint, string apiKey, int maxCompletionTokens)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(endpoint);
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);

        if (maxCompletionTokens < 1)
            throw new ArgumentOutOfRangeException(nameof(maxCompletionTokens), maxCompletionTokens,
                "Must be at least 1.");

        _endpoint = endpoint.Trim();
        _apiKey = apiKey.Trim();
        _maxCompletionTokens = maxCompletionTokens;
    }

    /// <summary>Returns or creates a client for <paramref name="deploymentName" />.</summary>
    public AzureOpenAiCompletionClient GetOrAdd(string deploymentName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentName);

        string key = deploymentName.Trim();

        return _clients.GetOrAdd(
            key,
            k => new AzureOpenAiCompletionClient(_endpoint, _apiKey, k, _maxCompletionTokens));
    }
}
