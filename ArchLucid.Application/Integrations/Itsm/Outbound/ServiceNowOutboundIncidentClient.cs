using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>HTTP calls to ServiceNow Table API for <c>incident</c> and optional <c>cmdb_ci_appl</c> lookup.</summary>
public sealed class ServiceNowOutboundIncidentClient(HttpClient http, ILogger<ServiceNowOutboundIncidentClient> logger)
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));

    private readonly ILogger<ServiceNowOutboundIncidentClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<ServiceNowCmdbCiResolveResult> TryResolveCmdbCiApplSysIdAsync(
        Uri instanceRoot,
        string username,
        string password,
        string systemName,
        bool autoCreateWhenMissing,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(systemName))
            return new ServiceNowCmdbCiResolveResult(false, null, null, null);

        string encoded = Uri.EscapeDataString(systemName.Trim());
        string root = instanceRoot.GetLeftPart(UriPartial.Authority).TrimEnd('/');
        Uri uri = new($"{root}/api/now/table/cmdb_ci_appl?sysparm_limit=1&sysparm_query=name={encoded}");

        using HttpRequestMessage request = new(HttpMethod.Get, uri);
        ApplyBasicAuth(request, username, password);

        HttpResponseMessage response;

        try
        {
            response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "ServiceNow CMDB lookup failed: transport error.");

            return new ServiceNowCmdbCiResolveResult(false, null, HttpStatusCode.ServiceUnavailable, "ServiceNow CMDB lookup failed (network error).");
        }

        string raw = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                return new ServiceNowCmdbCiResolveResult(true, null, response.StatusCode, TruncateForUser(raw));

            return new ServiceNowCmdbCiResolveResult(false, null, null, null);
        }

        string? sysId = TryReadFirstResultSysId(raw);

        if (!string.IsNullOrWhiteSpace(sysId))
            return new ServiceNowCmdbCiResolveResult(false, sysId.Trim(), null, null);

        if (!autoCreateWhenMissing)
            return new ServiceNowCmdbCiResolveResult(false, null, null, null);

        return await TryCreateCmdbCiApplAsync(instanceRoot, username, password, systemName.Trim(), ct).ConfigureAwait(false);
    }

    public async Task<ServiceNowIncidentHttpResult> CreateIncidentAsync(
        Uri incidentTableUri,
        string username,
        string password,
        string shortDescription,
        string description,
        string urgency,
        string impact,
        string? cmdbCiSysId,
        CancellationToken ct)
    {
        IncidentCreatePayload body = new()
        {
            ShortDescription = shortDescription,
            Description = description,
            Urgency = urgency,
            Impact = impact,
            CmdbCi = cmdbCiSysId
        };

        using HttpRequestMessage request = new(HttpMethod.Post, incidentTableUri);
        ApplyBasicAuth(request, username, password);
        string incidentJson = JsonSerializer.Serialize(body, SerializerOptions);
        request.Content = new StringContent(incidentJson, Encoding.UTF8, "application/json");

        HttpResponseMessage response;

        try
        {
            response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "ServiceNow incident create failed: transport error.");

            return new ServiceNowIncidentHttpResult(
                false,
                null,
                null,
                HttpStatusCode.ServiceUnavailable,
                "ServiceNow request could not be completed (network error).");
        }

        string raw = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        if (response.IsSuccessStatusCode)
        {
            try
            {
                ServiceNowSingleResultEnvelope? env = JsonSerializer.Deserialize<ServiceNowSingleResultEnvelope>(raw, SerializerOptions);

                if (env?.Result is null ||
                    string.IsNullOrWhiteSpace(env.Result.SysId) ||
                    string.IsNullOrWhiteSpace(env.Result.Number))
                {
                    return new ServiceNowIncidentHttpResult(
                        false,
                        null,
                        null,
                        response.StatusCode,
                        "ServiceNow returned success but no incident identifiers.");
                }

                return new ServiceNowIncidentHttpResult(
                    true,
                    env.Result.SysId.Trim(),
                    env.Result.Number.Trim(),
                    response.StatusCode,
                    null);
            }
            catch (JsonException)
            {
                return new ServiceNowIncidentHttpResult(
                    false,
                    null,
                    null,
                    response.StatusCode,
                    "ServiceNow returned success but the response could not be parsed.");
            }
        }

        return new ServiceNowIncidentHttpResult(
            false,
            null,
            null,
            response.StatusCode,
            TruncateForUser(raw));
    }

    private async Task<ServiceNowCmdbCiResolveResult> TryCreateCmdbCiApplAsync(
        Uri instanceRoot,
        string username,
        string password,
        string name,
        CancellationToken ct)
    {
        string root = instanceRoot.GetLeftPart(UriPartial.Authority).TrimEnd('/');
        Uri uri = new($"{root}/api/now/table/cmdb_ci_appl");

        object body = new { name };

        using HttpRequestMessage request = new(HttpMethod.Post, uri);
        ApplyBasicAuth(request, username, password);
        string cmJson = JsonSerializer.Serialize(body, SerializerOptions);
        request.Content = new StringContent(cmJson, Encoding.UTF8, "application/json");

        HttpResponseMessage response;

        try
        {
            response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "ServiceNow CMDB create failed: transport error.");

            return new ServiceNowCmdbCiResolveResult(false, null, HttpStatusCode.ServiceUnavailable, "ServiceNow CMDB create failed (network error).");
        }

        string raw = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                return new ServiceNowCmdbCiResolveResult(true, null, response.StatusCode, TruncateForUser(raw));

            return new ServiceNowCmdbCiResolveResult(false, null, null, null);
        }

        try
        {
            ServiceNowSingleResultEnvelope? env = JsonSerializer.Deserialize<ServiceNowSingleResultEnvelope>(raw, SerializerOptions);
            string? sysId = env?.Result?.SysId;

            if (string.IsNullOrWhiteSpace(sysId))
                return new ServiceNowCmdbCiResolveResult(false, null, null, null);

            return new ServiceNowCmdbCiResolveResult(false, sysId.Trim(), null, null);
        }
        catch (JsonException)
        {
            return new ServiceNowCmdbCiResolveResult(false, null, null, null);
        }
    }

    private static void ApplyBasicAuth(HttpRequestMessage request, string username, string password)
    {
        string token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", token);
    }

    private static string? TryReadFirstResultSysId(string raw)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(raw);

            if (!doc.RootElement.TryGetProperty("result", out JsonElement arr) || arr.ValueKind != JsonValueKind.Array)
                return null;

            foreach (JsonElement row in arr.EnumerateArray())
            {
                if (row.TryGetProperty("sys_id", out JsonElement sid))
                    return sid.GetString();
            }
        }
        catch (JsonException)
        {
            return null;
        }

        return null;
    }

    private static string TruncateForUser(string raw)
    {
        if (string.IsNullOrEmpty(raw))
            return "ServiceNow request failed.";

        if (raw.Length <= 2048)
            return raw;

        return raw[..2048];
    }

    private sealed class IncidentCreatePayload
    {
        [JsonPropertyName("short_description")]
        public string ShortDescription { get; init; } = "";

        [JsonPropertyName("description")]
        public string Description { get; init; } = "";

        [JsonPropertyName("urgency")]
        public string Urgency { get; init; } = "";

        [JsonPropertyName("impact")]
        public string Impact { get; init; } = "";

        [JsonPropertyName("cmdb_ci")]
        public string? CmdbCi { get; init; }
    }

    private sealed class ServiceNowIncidentResult
    {
        [JsonPropertyName("sys_id")]
        public string? SysId { get; set; }

        [JsonPropertyName("number")]
        public string? Number { get; set; }
    }

    private sealed class ServiceNowSingleResultEnvelope
    {
        [JsonPropertyName("result")]
        public ServiceNowIncidentResult? Result { get; set; }
    }
}

public sealed record ServiceNowCmdbCiResolveResult(
    bool Fatal,
    string? SysId,
    HttpStatusCode? StatusCode,
    string? ErrorDetail);

public sealed record ServiceNowIncidentHttpResult(
    bool Ok,
    string? SysId,
    string? Number,
    HttpStatusCode StatusCode,
    string? ErrorDetail);
