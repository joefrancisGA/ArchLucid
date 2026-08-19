using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Contracts.Common;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>HTTP calls to Jira Cloud issue REST (no SDK).</summary>
public sealed class JiraOutboundIssueClient(HttpClient http, ILogger<JiraOutboundIssueClient> logger)
{
    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));
    private readonly ILogger<JiraOutboundIssueClient> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<JiraOutboundIssueHttpResult> CreateIssueAsync(Uri issuePostUri, AuthenticationHeaderValue authorization, string projectKey,
        string summary, JsonElement descriptionAdf, string issueTypeName, string priorityName, CancellationToken ct,
        string? assigneeAccountId = null, string? dueDateYyyyMmDd = null)
    {
        ArgumentNullException.ThrowIfNull(authorization);
        ArgumentNullException.ThrowIfNull(projectKey);
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(issueTypeName);
        ArgumentNullException.ThrowIfNull(priorityName);
        ArgumentNullException.ThrowIfNull(issuePostUri);

        Dictionary<string, object?> fields = new()
        {
            ["project"] = new { key = projectKey },
            ["summary"] = summary,
            ["description"] = descriptionAdf,
            ["issuetype"] = new { name = issueTypeName },
            ["priority"] = new { name = priorityName }
        };

        if (ItsmOutboundVendorRemediationFields.LooksLikeJiraAccountId(assigneeAccountId))
            fields["assignee"] = new { accountId = assigneeAccountId!.Trim() };

        if (!string.IsNullOrWhiteSpace(dueDateYyyyMmDd))
            fields["duedate"] = dueDateYyyyMmDd.Trim();

        object body = new { fields };
        using HttpRequestMessage request = new(HttpMethod.Post, issuePostUri);
        ItsmOutboundHttpAuthorizationHeaders.Apply(request, authorization);
        request.Content = JsonContent.Create(body, options: ContractJson.CamelCaseIgnoreNullCompact);
        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Jira outbound create failed: transport error.");

            string detail = ex is OperationCanceledException
                ? "Jira request timed out."
                : "Jira request could not be completed (network error).";

            return new JiraOutboundIssueHttpResult(false, null, null, HttpStatusCode.ServiceUnavailable, detail);
        }

        string raw = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        // ReSharper disable once InvertIf
        if (response.IsSuccessStatusCode)
        {
            try
            {
                JiraCreateIssueResponse? parsed = JsonSerializer.Deserialize<JiraCreateIssueResponse>(raw, ContractJson.CamelCaseIgnoreNullCompact);
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

        return raw.Length <= 2048 ? raw : raw[..2048];
    }

    private sealed record JiraCreateIssueResponse(string? Id, string? Key);
}

public sealed record JiraOutboundIssueHttpResult(bool Ok, string? IssueKey, string? RemoteId, HttpStatusCode StatusCode, string? ErrorDetail);
