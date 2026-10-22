using System.Net.Http.Headers;

namespace ArchLucid.Cli;

/// <summary>
///     Shared HTTP client for CLI probe commands (pilot proof, buyer pack, real-mode smoke, doctor readiness).
/// </summary>
internal sealed class CliHttpProbeSession : IDisposable
{
    private bool _clientDetached;

    private CliHttpProbeSession(HttpClient http)
    {
        Http = http;
    }

    public HttpClient Http { get; }

    public static CliHttpProbeSession ForApi(
        string baseUrl,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = null,
        TimeSpan? timeout = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(baseUrl);

        string normalized = baseUrl.Trim().TrimEnd('/');
        HttpClient http = new()
        {
            Timeout = timeout ?? TimeSpan.FromMinutes(2),
            BaseAddress = new Uri(normalized + "/"),
        };

        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        if (!string.IsNullOrWhiteSpace(apiKey))
            http.DefaultRequestHeaders.Add("X-Api-Key", apiKey);

        return new CliHttpProbeSession(http);
    }

    /// <summary>Transfers HTTP client ownership to the caller; <see cref="Dispose" /> becomes a no-op.</summary>
    public HttpClient DetachClient()
    {
        _clientDetached = true;

        return Http;
    }

    /// <summary>Detached probe client (caller owns lifetime) for non-API endpoints such as Azure OpenAI.</summary>
    public static HttpClient CreateDetachedProbe(TimeSpan timeout)
    {
        SocketsHttpHandler handler = new()
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(2),
        };

        return new HttpClient(handler)
        {
            Timeout = timeout,
        };
    }

    public void SetAcceptJson()
    {
        Http.DefaultRequestHeaders.Accept.Clear();
        Http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public void SetAcceptMarkdown()
    {
        Http.DefaultRequestHeaders.Accept.Clear();
        Http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("text/markdown"));
    }

    public void SetAcceptPdf()
    {
        Http.DefaultRequestHeaders.Accept.Clear();
        Http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/pdf"));
    }

    public async Task<CliPilotRunDeltasFetchResult> FetchPilotRunDeltasAsync(
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string path = $"v1/pilots/runs/{Uri.EscapeDataString(runId)}/pilot-run-deltas";

        using HttpResponseMessage response = await Http.GetAsync(path, cancellationToken);
        string body = await response.Content.ReadAsStringAsync(cancellationToken);

        return new CliPilotRunDeltasFetchResult(
            (int)response.StatusCode,
            response.StatusCode == System.Net.HttpStatusCode.NotFound,
            response.IsSuccessStatusCode,
            body);
    }

    public void Dispose()
    {
        if (!_clientDetached)
            Http.Dispose();
    }
}

internal readonly record struct CliPilotRunDeltasFetchResult(
    int StatusCode,
    bool NotFound,
    bool Success,
    string Body);
