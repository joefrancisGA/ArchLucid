using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Common;

using JetBrains.Annotations;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>HTTP calls to ServiceNow Table API for <c>incident</c> and optional <c>cmdb_ci_appl</c> lookup.</summary>
public sealed class ServiceNowOutboundIncidentClient(HttpClient http, ILogger<ServiceNowOutboundIncidentClient> logger)
{
    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));
    private readonly ILogger<ServiceNowOutboundIncidentClient> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<ServiceNowCmdbCiResolveResult> TryResolveCmdbCiApplSysIdAsync(Uri instanceRoot, string username, string password, string systemName,
        bool autoCreateWhenMissing, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(instanceRoot);
        ArgumentNullException.ThrowIfNull(username);
        ArgumentNullException.ThrowIfNull(password);
        ArgumentNullException.ThrowIfNull(systemName);
        if (string.IsNullOrWhiteSpace(systemName))
            return new ServiceNowCmdbCiResolveResult(false, null, null, null);

        string nameQuery = systemName.Trim();
        Uri uri = ServiceNowCmdbCiApplTableApi.BuildLookupBySystemNameUri(instanceRoot, nameQuery);
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

            string detail = ex is OperationCanceledException
                ? "ServiceNow CMDB lookup timed out."
                : "ServiceNow CMDB lookup failed (network error).";

            return new ServiceNowCmdbCiResolveResult(false, null, HttpStatusCode.ServiceUnavailable, detail);
        }

        string raw = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            return response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden ? new ServiceNowCmdbCiResolveResult(true, null, response.StatusCode, TruncateForUser(raw)) : new ServiceNowCmdbCiResolveResult(false, null, null, null);
        }

        string? sysId = TryReadFirstResultSysId(raw);

        if (!string.IsNullOrWhiteSpace(sysId))
            return new ServiceNowCmdbCiResolveResult(false, sysId.Trim(), null, null);

        if (!autoCreateWhenMissing)
            return new ServiceNowCmdbCiResolveResult(false, null, null, null);

        return await TryCreateCmdbCiApplAsync(instanceRoot, username, password, nameQuery, ct).ConfigureAwait(false);
    }

    public async Task<ServiceNowIncidentHttpResult> CreateIncidentAsync(Uri incidentTableUri, string username, string password, string shortDescription,
        string description, string urgency, string impact, string? cmdbCiSysId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(incidentTableUri);
        ArgumentNullException.ThrowIfNull(username);
        ArgumentNullException.ThrowIfNull(password);
        ArgumentNullException.ThrowIfNull(shortDescription);
        ArgumentNullException.ThrowIfNull(description);
        ArgumentNullException.ThrowIfNull(urgency);
        ArgumentNullException.ThrowIfNull(impact);
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
        string incidentJson = JsonSerializer.Serialize(body, ContractJson.CamelCaseIgnoreNullCompact);
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

            string detail = ex is OperationCanceledException
                ? "ServiceNow request timed out."
                : "ServiceNow request could not be completed (network error).";

            return new ServiceNowIncidentHttpResult(false, null, null, HttpStatusCode.ServiceUnavailable, detail);
        }

        string raw = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        // ReSharper disable once InvertIf
        if (response.IsSuccessStatusCode)
        {
            try
            {
                ServiceNowSingleResultEnvelope? env = JsonSerializer.Deserialize<ServiceNowSingleResultEnvelope>(raw, ContractJson.CamelCaseIgnoreNullCompact);

                if (env?.Result is null || string.IsNullOrWhiteSpace(env.Result.SysId) || string.IsNullOrWhiteSpace(env.Result.Number))
                {
                    return new ServiceNowIncidentHttpResult(false, null, null, response.StatusCode, "ServiceNow returned success but no incident identifiers.");
                }

                return new ServiceNowIncidentHttpResult(true, env.Result.SysId.Trim(), env.Result.Number.Trim(), response.StatusCode, null);
            }
            catch (JsonException)
            {
                return new ServiceNowIncidentHttpResult(false, null, null, response.StatusCode,
                    "ServiceNow returned success but the response could not be parsed.");
            }
        }

        return new ServiceNowIncidentHttpResult(false, null, null, response.StatusCode, TruncateForUser(raw));
    }

    private async Task<ServiceNowCmdbCiResolveResult> TryCreateCmdbCiApplAsync(Uri instanceRoot, string username, string password, string name,
        CancellationToken ct)
    {
        Uri uri = ServiceNowCmdbCiApplTableApi.BuildCreateUri(instanceRoot);
        object body = new
        {
            name
        };
        using HttpRequestMessage request = new(HttpMethod.Post, uri);
        ApplyBasicAuth(request, username, password);
        string cmJson = JsonSerializer.Serialize(body, ContractJson.CamelCaseIgnoreNullCompact);
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

            string detail = ex is OperationCanceledException
                ? "ServiceNow CMDB create timed out."
                : "ServiceNow CMDB create failed (network error).";

            return new ServiceNowCmdbCiResolveResult(false, null, HttpStatusCode.ServiceUnavailable, detail);
        }

        string raw = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            return response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden ? new ServiceNowCmdbCiResolveResult(true, null, response.StatusCode, TruncateForUser(raw)) : new ServiceNowCmdbCiResolveResult(false, null, null, null);
        }

        try
        {
            ServiceNowSingleResultEnvelope? env = JsonSerializer.Deserialize<ServiceNowSingleResultEnvelope>(raw, ContractJson.CamelCaseIgnoreNullCompact);
            string? sysId = env?.Result?.SysId;

            return string.IsNullOrWhiteSpace(sysId) ? new ServiceNowCmdbCiResolveResult(false, null, null, null) : new ServiceNowCmdbCiResolveResult(false, sysId.Trim(), null, null);
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

        return raw.Length <= 2048 ? raw : raw[..2048];
    }

    private sealed class IncidentCreatePayload
    {
        [JsonPropertyName("short_description")]
        public string ShortDescription
        {
            [UsedImplicitly]
            get;
            init;
        } = "";

        [JsonPropertyName("description")]
        public string Description
        {
            [UsedImplicitly]
            get;
            init;
        } = "";

        [JsonPropertyName("urgency")]
        public string Urgency
        {
            [UsedImplicitly]
            get;
            init;
        } = "";

        [JsonPropertyName("impact")]
        public string Impact
        {
            [UsedImplicitly]
            get;
            init;
        } = "";

        [JsonPropertyName("cmdb_ci")]
        public string? CmdbCi
        {
            [UsedImplicitly]
            get;
            init;
        }
    }

    private sealed class ServiceNowIncidentResult
    {
        [JsonPropertyName("sys_id")]
        public string? SysId
        {
            get;
            [UsedImplicitly]
            set;
        }

        [JsonPropertyName("number")]
        public string? Number
        {
            get;
            [UsedImplicitly]
            set;
        }
    }

    private sealed class ServiceNowSingleResultEnvelope
    {
        [JsonPropertyName("result")]
        public ServiceNowIncidentResult? Result
        {
            get;
            init;
        }
    }
}

public sealed record ServiceNowCmdbCiResolveResult(bool Fatal, string? SysId, HttpStatusCode? StatusCode, string? ErrorDetail);

public sealed record ServiceNowIncidentHttpResult(bool Ok, string? SysId, string? Number, HttpStatusCode StatusCode, string? ErrorDetail);
