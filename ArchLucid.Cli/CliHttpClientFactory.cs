using System.Net.Http;

namespace ArchLucid.Cli;

/// <summary>Central construction boundary for standalone CLI HTTP clients.
/// Callers own the returned client. No credentials or retries are added implicitly.
/// Custom handler ownership and existing per-command configuration remain explicit.</summary>
internal static class CliHttpClientFactory
{
    public static HttpClient Create(TimeSpan? timeout = null, Uri? baseAddress = null)
    {
        HttpClient client = new();
        if (timeout.HasValue)
            client.Timeout = timeout.Value;
        if (baseAddress is not null)
            client.BaseAddress = baseAddress;
        return client;
    }

    public static HttpClient Create(HttpMessageHandler handler, bool disposeHandler = true,
        TimeSpan? timeout = null, Uri? baseAddress = null)
    {
        ArgumentNullException.ThrowIfNull(handler);
        HttpClient client = new(handler, disposeHandler);
        if (timeout.HasValue)
            client.Timeout = timeout.Value;
        if (baseAddress is not null)
            client.BaseAddress = baseAddress;
        return client;
    }
}
