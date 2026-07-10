using System.Collections.Concurrent;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Caches <see cref="AzureOpenAiCompletionClient" /> instances per deployment name for a single endpoint/key pair.
/// </summary>
public sealed class AzureOpenAiCompletionClientCache : IDisposable
{
    private readonly ConcurrentDictionary<string, AzureOpenAiCompletionClient> _clients =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly Func<string, AzureOpenAiCompletionClient> _clientFactory;

    /// <summary>Creates a cache using a minimal client factory (endpoint, key, max tokens only).</summary>
    public AzureOpenAiCompletionClientCache(string endpoint, string apiKey, int maxCompletionTokens)
        : this(deploymentName => new AzureOpenAiCompletionClient(endpoint, apiKey, deploymentName, maxCompletionTokens))
    {
    }

    /// <summary>Creates a cache with a custom factory (structured output, telemetry, etc.).</summary>
    public AzureOpenAiCompletionClientCache(Func<string, AzureOpenAiCompletionClient> clientFactory)
    {
        _clientFactory = clientFactory ?? throw new ArgumentNullException(nameof(clientFactory));
    }

    /// <summary>Returns or creates a client for <paramref name="deploymentName" />.</summary>
    public AzureOpenAiCompletionClient GetOrAdd(string deploymentName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentName);

        string key = deploymentName.Trim();

        return _clients.GetOrAdd(key, _clientFactory);
    }

    /// <summary>Removes and disposes a cached client for <paramref name="deploymentName" />, if present.</summary>
    public bool TryRemove(string deploymentName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentName);

        string key = deploymentName.Trim();

        if (!_clients.TryRemove(key, out AzureOpenAiCompletionClient? client))
        {
            return false;
        }

        client.Dispose();

        return true;
    }

    /// <inheritdoc />
    public void Dispose()
    {
        foreach (AzureOpenAiCompletionClient client in _clients.Values)
        {
            client.Dispose();
        }
    }
}
