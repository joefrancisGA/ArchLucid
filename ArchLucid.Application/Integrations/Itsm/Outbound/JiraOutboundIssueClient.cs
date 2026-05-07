using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;
/// <summary>HTTP calls to Jira Cloud issue REST (no SDK).</summary>
public sealed class JiraOutboundIssueClient(HttpClient http, ILogger<JiraOutboundIssueClient> logger)
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };
    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));
    private readonly ILogger<JiraOutboundIssueClient> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    public async Task<JiraOutboundIssueHttpResult> CreateIssueAsync(Uri issuePostUri, string serviceAccountEmail, string apiToken, string projectKey, string summary, JsonElement descriptionAdf, string issueTypeName, string priorityName, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(serviceAccountEmail);
        ArgumentNullException.ThrowIfNull(apiToken);
        ArgumentNullException.ThrowIfNull(projectKey);
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(issueTypeName);
        ArgumentNullException.ThrowIfNull(priorityName);
        ArgumentNullException.ThrowIfNull(issuePostUri);
        if (string.IsNullOrWhiteSpace(serviceAccountEmail))
            throw new ArgumentException("serviceAccountEmail is required.", nameof(serviceAccountEmail));
        if (string.IsNullOrWhiteSpace(apiToken))
            throw new ArgumentException("apiToken is required.", nameof(apiToken));
        object body = new
        {
            fields = new
            {
                project = new
                {
                    key = projectKey
                },
                summary,
                description = descriptionAdf,
                issuetype = new
                {
                    name = issueTypeName
                },
                priority = new
                {
                    name = priorityName
                }
            }
        };
        using HttpRequestMessage request = new(HttpMethod.Post, issuePostUri);
        string basic = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{serviceAccountEmail}:{apiToken}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", basic);
        request.Content = JsonContent.Create(body, options: SerializerOptions);
        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Jira outbound create failed: transport error.");
            return new JiraOutboundIssueHttpResult(false, null, null, HttpStatusCode.ServiceUnavailable, "Jira request could not be completed (network error).");
        }

        string raw = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        if (response.IsSuccessStatusCode)
        {
            try
            {
                JiraCreateIssueResponse? parsed = JsonSerializer.Deserialize<JiraCreateIssueResponse>(raw, SerializerOptions);
                if (parsed is null || string.IsNullOrWhiteSpace(parsed.Key))
                    return new JiraOutboundIssueHttpResult(false, null, null, response.StatusCode, "Jira returned success but no issue key.");
                return new JiraOutboundIssueHttpResult(true, parsed.Key.Trim(), parsed.Id, response.StatusCode, null);
            }
            catch (JsonException)
            {
                return new JiraOutboundIssueHttpResult(false, null, null, response.StatusCode, "Jira returned success but the response could not be parsed.");
            }
        }

        return new JiraOutboundIssueHttpResult(false, null, null, response.StatusCode, TruncateForUser(raw));
    }

    private static string TruncateForUser(string raw)
    {
        if (string.IsNullOrEmpty(raw))
            return "Jira request failed.";
        if (raw.Length <= 2048)
            return raw;
        return raw[..2048];
    }

    private sealed record JiraCreateIssueResponse(string? Id, string? Key);
}

public sealed record JiraOutboundIssueHttpResult(bool Ok, string? IssueKey, string? RemoteId, HttpStatusCode StatusCode, string? ErrorDetail);