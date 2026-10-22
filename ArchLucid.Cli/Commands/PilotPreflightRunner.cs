using System.Net;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     HTTP + local configuration checks for <c>archlucid pilot preflight</c>.
/// </summary>
internal sealed class PilotPreflightRunner(HttpClient http)
{
    private static readonly JsonSerializerOptions JsonCamel = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));

    public async Task<PilotPreflightReport> RunAsync(
        string baseUrl,
        IReadOnlyList<PilotPreflightStepResult> localSteps,
        CancellationToken cancellationToken = default)
    {
        return await RunAsync(baseUrl, localSteps, new PilotPreflightOptions(), cancellationToken);
    }

    public async Task<PilotPreflightReport> RunAsync(
        string baseUrl,
        IReadOnlyList<PilotPreflightStepResult> localSteps,
        PilotPreflightOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(baseUrl);
        ArgumentNullException.ThrowIfNull(options);

        List<PilotPreflightStepResult> steps = [.. localSteps];

        if (!options.NoApi)
        {
            steps.Add(await ProbeAsync("health/live", "/health/live", HttpStatusCode.OK, true, cancellationToken));
            steps.Add(await ProbeAsync("health/ready", "/health/ready", HttpStatusCode.OK, true, cancellationToken));
            steps.Add(await ProbeAsync("version", "/version", HttpStatusCode.OK, false, cancellationToken));
            steps.Add(await ProbeOpenApiAsync(cancellationToken));

            if (options.IncludeItsm)
                steps.Add(await ProbeItsmHealthAsync(cancellationToken));
        }
        else
        {
            steps.Add(new PilotPreflightStepResult
            {
                Name = "api-probes",
                Disposition = PilotPreflightDisposition.Pass,
                Detail = "Skipped (--no-api offline mode).",
            });
        }

        return new PilotPreflightReport { BaseUrl = baseUrl.Trim().TrimEnd('/'), Steps = steps };
    }

    private async Task<PilotPreflightStepResult> ProbeAsync(
        string name,
        string relativePath,
        HttpStatusCode expectedStatus,
        bool blocking,
        CancellationToken cancellationToken)
    {
        try
        {
            using HttpResponseMessage response = await _http.GetAsync(relativePath, cancellationToken);
            string bodyPreview = await response.Content.ReadAsStringAsync(cancellationToken);
            string trimmed = bodyPreview.Length <= 240 ? bodyPreview : bodyPreview[..240] + "…";

            if (response.StatusCode == expectedStatus)
            {
                return new PilotPreflightStepResult
                {
                    Name = name,
                    Disposition = PilotPreflightDisposition.Pass,
                    Detail = $"HTTP {(int)response.StatusCode} — {trimmed}",
                };
            }

            return new PilotPreflightStepResult
            {
                Name = name,
                Disposition = blocking ? PilotPreflightDisposition.Block : PilotPreflightDisposition.Warn,
                Detail = $"Expected HTTP {(int)expectedStatus}; got {(int)response.StatusCode} — {trimmed}",
                Remediation = blocking
                    ? "Start the API host, apply SQL migrations, and confirm auth headers if required."
                    : null,
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return new PilotPreflightStepResult
            {
                Name = name,
                Disposition = blocking ? PilotPreflightDisposition.Block : PilotPreflightDisposition.Warn,
                Detail = ex.Message,
                Remediation = "Confirm ARCHLUCID_API_URL / --api-base-url and network reachability.",
            };
        }
    }

    private async Task<PilotPreflightStepResult> ProbeOpenApiAsync(CancellationToken cancellationToken)
    {
        try
        {
            using HttpResponseMessage response = await _http.GetAsync("/openapi/v1.json", cancellationToken);

            if (response.StatusCode != HttpStatusCode.OK)
            {
                return new PilotPreflightStepResult
                {
                    Name = "openapi/v1.json",
                    Disposition = PilotPreflightDisposition.Block,
                    Detail = $"HTTP {(int)response.StatusCode}",
                    Remediation = "Canonical contract must be served at GET /openapi/v1.json.",
                };
            }

            string json = await response.Content.ReadAsStringAsync(cancellationToken);
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;

            if (!root.TryGetProperty("openapi", out JsonElement openApiVersion)
                || openApiVersion.ValueKind != JsonValueKind.String)
            {
                return new PilotPreflightStepResult
                {
                    Name = "openapi/v1.json",
                    Disposition = PilotPreflightDisposition.Block,
                    Detail = "Missing openapi version field.",
                };
            }

            string versionLabel = "(unknown)";

            if (root.TryGetProperty("info", out JsonElement info)
                && info.TryGetProperty("version", out JsonElement infoVersion)
                && infoVersion.ValueKind == JsonValueKind.String)
            {
                versionLabel = infoVersion.GetString() ?? versionLabel;
            }

            return new PilotPreflightStepResult
            {
                Name = "openapi/v1.json",
                Disposition = PilotPreflightDisposition.Pass,
                Detail = $"openapi={openApiVersion.GetString()} info.version={versionLabel}",
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException or TaskCanceledException)
        {
            return new PilotPreflightStepResult
            {
                Name = "openapi/v1.json",
                Disposition = PilotPreflightDisposition.Block,
                Detail = ex.Message,
            };
        }
    }

    private async Task<PilotPreflightStepResult> ProbeItsmHealthAsync(CancellationToken cancellationToken)
    {
        try
        {
            using HttpResponseMessage response = await _http.GetAsync("/v1/integrations/itsm/health", cancellationToken);
            string bodyPreview = await response.Content.ReadAsStringAsync(cancellationToken);
            string trimmed = bodyPreview.Length <= 240 ? bodyPreview : bodyPreview[..240] + "…";

            if (response.StatusCode == HttpStatusCode.OK)
            {
                return new PilotPreflightStepResult
                {
                    Name = "itsm-health",
                    Disposition = PilotPreflightDisposition.Pass,
                    Detail = $"HTTP {(int)response.StatusCode} — {trimmed}",
                };
            }

            return new PilotPreflightStepResult
            {
                Name = "itsm-health",
                Disposition = PilotPreflightDisposition.Warn,
                Detail = $"HTTP {(int)response.StatusCode} — {trimmed}",
                Remediation = "Check ITSM integration credentials and upstream connectivity. "
                              + "See docs/library/CONFIGURATION_REFERENCE.md §ITSM.",
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return new PilotPreflightStepResult
            {
                Name = "itsm-health",
                Disposition = PilotPreflightDisposition.Warn,
                Detail = ex.Message,
                Remediation = "Confirm ITSM integration is configured and the API host can reach the ITSM upstream.",
            };
        }
    }

    internal static string SerializeJson(PilotPreflightReport report)
    {
        return JsonSerializer.Serialize(report, JsonCamel);
    }
}
