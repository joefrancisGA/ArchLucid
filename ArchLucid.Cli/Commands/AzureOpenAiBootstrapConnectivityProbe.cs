namespace ArchLucid.Cli.Commands;

/// <summary>GET <c>/openai/models</c> against an Azure OpenAI resource to verify endpoint + API key.</summary>
public static class AzureOpenAiBootstrapConnectivityProbe
{
    // Stable surface used by the Azure OpenAI control plane for enumerating account models.
    private const string ModelsRelativePath = "openai/models?api-version=2024-06-01";

    /// <summary>Issues a lightweight authenticated GET; treats HTTP 2xx as success.</summary>
    public static async Task<AzureOpenAiBootstrapProbeResult> ProbeAsync(
        HttpClient httpClient,
        string endpoint,
        string apiKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(httpClient);

        if (string.IsNullOrWhiteSpace(endpoint))
            return Fail("Azure OpenAI endpoint is empty.");

        if (string.IsNullOrWhiteSpace(apiKey))
            return Fail("Azure OpenAI API key is empty.");

        try
        {
            ConfigBootstrapDocumentMerger.ValidateHttpsResourceEndpoint(endpoint);
        }
        catch (ArgumentException ex)
        {
            return Fail(ex.Message);
        }

        Uri baseUri = new(endpoint.Trim().TrimEnd('/') + "/", UriKind.Absolute);
        Uri requestUri = new(baseUri, ModelsRelativePath);

        using HttpRequestMessage request = new(HttpMethod.Get, requestUri);
        request.Headers.TryAddWithoutValidation("api-key", apiKey.Trim());

        try
        {
            using HttpResponseMessage response = await httpClient.SendAsync(request, cancellationToken);
            int status = (int)response.StatusCode;

            if (response.IsSuccessStatusCode)
                return new AzureOpenAiBootstrapProbeResult { Succeeded = true, HttpStatusCode = status };

            return new AzureOpenAiBootstrapProbeResult
            {
                Succeeded = false,
                HttpStatusCode = status,
                Error =
                    $"Azure OpenAI returned HTTP {status}. Check the endpoint, API key, and network access.",
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return Fail($"Could not reach Azure OpenAI ({ex.Message}).");
        }
    }

    private static AzureOpenAiBootstrapProbeResult Fail(string message) =>
        new() { Succeeded = false, HttpStatusCode = null, Error = message };
}
