using System.Net;

using ArchLucid.Cli.Commands;

namespace ArchLucid.Cli;

/// <summary>
///     INV-010: single construction site for CLI <see cref="HttpClient" /> instances (standalone tool — not host
///     <c>IHttpClientFactory</c>).
/// </summary>
internal static class ArchLucidCliHttpClientFactory
{
    public static HttpClient Create(HttpMessageHandler handler, bool disposeHandler, Action<HttpClient>? configure = null)
    {
        HttpClient http = new(handler, disposeHandler);

        configure?.Invoke(http);

        return http;
    }

    public static HttpClient CreateDefault(TimeSpan? timeout = null)
    {
        HttpClient http = new();

        if (timeout is not null)
            http.Timeout = timeout.Value;

        return http;
    }

    public static HttpClient CreateWithBaseAddress(string baseUrl, TimeSpan? timeout = null)
    {
        string normalized = baseUrl.Trim().TrimEnd('/');
        HttpClient http = CreateDefault(timeout);
        http.BaseAddress = new Uri(normalized + "/");

        return http;
    }

    public static HttpClient CreateApiClient(
        string normalizedBaseUrl,
        bool useRetry,
        CliResilienceOptions? httpResilience,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? cliConfig)
    {
        HttpMessageHandler inner = new HttpClientHandler
        {
            AutomaticDecompression = DecompressionMethods.All,
        };

        if (useRetry)
            inner = new CliRetryDelegatingHandler(httpResilience) { InnerHandler = inner };

        return Create(
            inner,
            disposeHandler: true,
            http =>
            {
                http.BaseAddress = new Uri(normalizedBaseUrl + "/");
                http.Timeout = TimeSpan.FromSeconds(30);
                http.DefaultRequestHeaders.Add("Accept", "application/json");

                string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

                if (!string.IsNullOrWhiteSpace(apiKey))
                {
                    http.DefaultRequestHeaders.Remove("X-Api-Key");
                    http.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
                }

                ArchLucidProjectScaffolder.ArchLucidCliConfig? effectiveConfig =
                    cliConfig ?? CliCommandShared.TryLoadConfigFromCwd();
                CliScopeHeaders.Apply(http, effectiveConfig);
            });
    }

    public static HttpClient CreateProbeClient(string normalizedBaseUrl, TimeSpan timeout)
    {
        return Create(
            new HttpClientHandler { AutomaticDecompression = DecompressionMethods.All },
            disposeHandler: true,
            http =>
            {
                http.Timeout = timeout;
                http.BaseAddress = new Uri(normalizedBaseUrl + "/");

                string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

                if (!string.IsNullOrWhiteSpace(apiKey))
                    http.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
            });
    }

    public static HttpClient CreateDetachedProbe(TimeSpan timeout)
    {
        SocketsHttpHandler handler = new() { PooledConnectionLifetime = TimeSpan.FromMinutes(2) };

        return Create(handler, disposeHandler: true, http => http.Timeout = timeout);
    }
}
