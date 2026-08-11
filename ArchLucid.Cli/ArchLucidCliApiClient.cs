using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

/// <summary>
///     CLI-facing HTTP surface backed by the NSwag-generated <see cref="ArchLucidApiClient" /> (OpenAPI v1 contract).
///     Binary comparison replay/zip exports still use raw <see cref="HttpClient" /> because the OpenAPI model uses
///     <c>FileContentResult</c> JSON rather than octet-stream bodies.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "HTTP client against live API; covered by CLI integration tests.")]
public sealed partial class ArchLucidApiClient
{
    /// <summary>
    ///     Contracts → NSwag <c>Gen.*</c> round-trip: generated request DTOs use numeric enums (
    ///     <see cref="Gen.ArchitectureRequest.CloudProvider" />, <see cref="Gen.AgentResult.AgentType" />), so bridging
    ///     JSON must not emit string enum tokens.
    /// </summary>
    private static readonly JsonSerializerOptions GenNumericEnumBridgeJson = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase, PropertyNameCaseInsensitive = true
    };

    /// <summary>
    ///     API + NSwag wire JSON uses string enums for several DTOs; ArchLucid.Contracts CLI projection types use the same
    ///     names.
    /// </summary>
    private static readonly JsonSerializerOptions ContractEnumAwareJson = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase, PropertyNameCaseInsensitive = true, Converters = { new JsonStringEnumConverter() }
    };

    private readonly Gen.ArchLucidApiClient _api;
    private readonly HttpClient _http;

    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = false,
        Converters = { new JsonStringEnumConverter() },
    };

    public ArchLucidApiClient(string baseUrl, ArchLucidProjectScaffolder.ArchLucidCliConfig? cliConfig = null)
    {
        string? invalidReason = GetInvalidApiBaseUrlReason(baseUrl);

        if (invalidReason is not null)
            throw new ArgumentException(invalidReason, nameof(baseUrl));

        string normalized = baseUrl.Trim().TrimEnd('/');
        ArchLucidProjectScaffolder.ArchLucidCliConfig? effectiveConfig =
            cliConfig ?? CliCommandShared.TryLoadConfigFromCwd();
        CliResilienceOptions httpResilience = CliResilienceOptions.FromCliConfig(effectiveConfig);
        _http = CreateHttpClient(normalized, true, httpResilience, effectiveConfig);
        _api = new Gen.ArchLucidApiClient(_http) { BaseUrl = normalized + "/", ReadResponseAsString = true };
    }

    /// <summary>
    ///     Constructor for testing: use a provided HttpClient (e.g. with a mock handler).
    ///     No retry pipeline is used so tests get deterministic behavior.
    /// </summary>
    public ArchLucidApiClient(HttpClient httpClient)
    {
        ArgumentNullException.ThrowIfNull(httpClient);
        _http = httpClient;
        string baseUrl = httpClient.BaseAddress?.ToString().Trim().TrimEnd('/') ?? "http://localhost";
        _api = new Gen.ArchLucidApiClient(_http) { BaseUrl = baseUrl + "/", ReadResponseAsString = true };
    }

    private static HttpClient CreateHttpClient(string normalizedBaseUrl, bool useRetry,
        CliResilienceOptions? httpResilience = null,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? cliConfig = null)
    {
        HttpMessageHandler inner = new HttpClientHandler
        {
            // API may respond with Content-Encoding: gzip/br (see AddArchLucidResponseCompression). Without this,
            // NSwag's stream deserializer fails with JsonException on compressed bodies (lock-baseline, doctor, etc.).
            AutomaticDecompression = DecompressionMethods.All
        };

        if (useRetry)

            inner = new CliRetryDelegatingHandler(httpResilience) { InnerHandler = inner };

        HttpClient http = new(inner, true) { BaseAddress = new Uri(normalizedBaseUrl + "/"), Timeout = TimeSpan.FromSeconds(30) };
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

        return http;
    }

    /// <summary>
    ///     CLI subcommands that call REST routes not covered by the generated OpenAPI client reuse the same decompress,
    ///     retry, and API-key behavior as <see cref="ArchLucidApiClient" />.
    /// </summary>
    public static HttpClient CreateSharedApiHttpClient(
        string baseUrl,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? cliConfig = null)
    {
        string? invalidReason = GetInvalidApiBaseUrlReason(baseUrl);

        if (invalidReason is not null)
            throw new ArgumentException(invalidReason, nameof(baseUrl));

        string normalized = baseUrl.Trim().TrimEnd('/');
        ArchLucidProjectScaffolder.ArchLucidCliConfig? effectiveConfig =
            cliConfig ?? CliCommandShared.TryLoadConfigFromCwd();
        CliResilienceOptions httpResilience = CliResilienceOptions.FromCliConfig(effectiveConfig);

        return CreateHttpClient(normalized, true, httpResilience, effectiveConfig);
    }

    public static string GetDefaultBaseUrl()
    {
        string? fromEnv = Environment.GetEnvironmentVariable("ARCHLUCID_API_URL");

        return string.IsNullOrWhiteSpace(fromEnv) ? string.Empty : fromEnv.Trim();
    }

    /// <summary>
    ///     Returns a human-readable reason when the value cannot be used as an absolute HTTP API base URL, or null when valid.
    /// </summary>
    public static string? GetInvalidApiBaseUrlReason(string? baseUrl)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))

            return
                "API base URL is empty. Set apiUrl in archlucid.json in the project folder or ARCHLUCID_API_URL (example: https://staging.archlucid.net).";

        string trimmed = baseUrl.Trim();

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? uri))

            return
                $"API base URL is not a valid absolute URL: '{trimmed}'. Use http:// or https:// with a host (example: https://staging.archlucid.net).";

        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
            return $"API base URL must use http or https (got '{uri.Scheme}').";

        return null;
    }

    /// <summary>
    ///     Resolve API base URL: <c>config.ApiUrl</c> (when set) &gt; <c>ARCHLUCID_API_URL</c>.
    ///     There is no localhost default — set <c>apiUrl</c> or <c>ARCHLUCID_API_URL</c> for hosted targets.
    /// </summary>
    public static string ResolveBaseUrl(ArchLucidProjectScaffolder.ArchLucidCliConfig? config)
    {
        if (!string.IsNullOrWhiteSpace(config?.ApiUrl))
            return config.ApiUrl.Trim().TrimEnd('/');

        string fromEnv = GetDefaultBaseUrl();

        return string.IsNullOrEmpty(fromEnv) ? fromEnv : fromEnv.TrimEnd('/');
    }

    private static void LogCliFailure(string operation, Exception ex)
    {
        Console.Error.WriteLine($"[ArchLucid CLI] {operation} failed: {ex.GetType().Name}: {ex.Message}");
    }
}
