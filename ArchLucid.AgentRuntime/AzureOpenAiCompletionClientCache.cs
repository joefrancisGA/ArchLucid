namespace ArchLucid.AgentRuntime;

/// <summary>
///     Caches <see cref="AzureOpenAiCompletionClient" /> instances per deployment name for a single endpoint/key pair.
/// </summary>
public sealed class AzureOpenAiCompletionClientCache : IDisposable
{
    private readonly Lock _gate = new();

    private readonly Dictionary<string, AzureOpenAiCompletionClient> _clients =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly Func<string, AzureOpenAiCompletionClient> _clientFactory;

    private bool _disposed;

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

        lock (_gate)
        {
            ObjectDisposedException.ThrowIf(_disposed, this);

            if (!_clients.TryGetValue(key, out AzureOpenAiCompletionClient? client))
            {
                // The factory creates an owned client. Do not construct competing instances and discard the losers.
                client = _clientFactory(key);
                _clients.Add(key, client);
            }

            return client;
        }
    }

    /// <summary>Removes and disposes a cached client for <paramref name="deploymentName" />, if present.</summary>
    public bool TryRemove(string deploymentName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentName);

        string key = deploymentName.Trim();

        AzureOpenAiCompletionClient? client;
        lock (_gate)
        {
            if (!_clients.Remove(key, out client))
                return false;
        }

        client.Dispose();

        return true;
    }

    /// <inheritdoc />
    public void Dispose()
    {
        AzureOpenAiCompletionClient[] clients;
        lock (_gate)
        {
            if (_disposed)
                return;

            _disposed = true;
            clients = [.. _clients.Values];
            _clients.Clear();
        }

        foreach (AzureOpenAiCompletionClient client in clients)
        {
            client.Dispose();
        }
    }
}
