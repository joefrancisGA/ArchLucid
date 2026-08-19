using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Common;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Integrations.AzureBoards.Outbound;

/// <summary>HTTP calls to Azure DevOps Boards work-item REST (no SDK).</summary>
public sealed class AzureBoardsOutboundIssueClient(HttpClient http, ILogger<AzureBoardsOutboundIssueClient> logger)
{
    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));
    private readonly ILogger<AzureBoardsOutboundIssueClient> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<AzureBoardsOutboundIssueHttpResult> CreateWorkItemAsync(
        Uri createUri,
        AuthenticationHeaderValue authorization,
        string title,
        string description,
        int priority,
        string? areaPath,
        string? iterationPath,
        string? tags,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(createUri);
        ArgumentNullException.ThrowIfNull(authorization);
        ArgumentException.ThrowIfNullOrWhiteSpace(title);

        List<object> patch =
        [
            new { op = "add", path = "/fields/System.Title", value = title },
            new { op = "add", path = "/fields/System.Description", value = description ?? string.Empty },
            new { op = "add", path = "/fields/Microsoft.VSTS.Common.Priority", value = priority }
        ];

        if (!string.IsNullOrWhiteSpace(areaPath))
            patch.Add(new { op = "add", path = "/fields/System.AreaPath", value = areaPath.Trim() });

        if (!string.IsNullOrWhiteSpace(iterationPath))
            patch.Add(new { op = "add", path = "/fields/System.IterationPath", value = iterationPath.Trim() });

        if (!string.IsNullOrWhiteSpace(tags))
            patch.Add(new { op = "add", path = "/fields/System.Tags", value = tags.Trim() });

        using HttpRequestMessage request = new(HttpMethod.Post, createUri);
        ItsmOutboundHttpAuthorizationHeaders.Apply(request, authorization);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Content = new StringContent(
            JsonSerializer.Serialize(patch, ContractJson.CamelCaseIgnoreNullCompact),
            Encoding.UTF8,
            "application/json-patch+json");

        HttpResponseMessage response;

        try
        {
            response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Azure Boards outbound create failed: transport error.");

            string detail = ex is OperationCanceledException
                ? "Azure Boards request timed out."
                : "Azure Boards request could not be completed (network error).";

            return new AzureBoardsOutboundIssueHttpResult(false, null, null, HttpStatusCode.ServiceUnavailable, detail);
        }

        string raw = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        if (response.IsSuccessStatusCode)
        {
            try
            {
                AzureBoardsCreateWorkItemResponse? parsed =
                    JsonSerializer.Deserialize<AzureBoardsCreateWorkItemResponse>(raw, ContractJson.CamelCaseIgnoreNullCompact);

                if (parsed is null || parsed.Id <= 0)
                    return new AzureBoardsOutboundIssueHttpResult(false, null, null, response.StatusCode, "Azure Boards returned success but no work item id.");

                string externalKey = parsed.Id.ToString();

                return new AzureBoardsOutboundIssueHttpResult(true, externalKey, externalKey, response.StatusCode, null);
            }
            catch (JsonException)
            {
                return new AzureBoardsOutboundIssueHttpResult(false, null, null, response.StatusCode, "Azure Boards returned success but the response could not be parsed.");
            }
        }

        return new AzureBoardsOutboundIssueHttpResult(false, null, null, response.StatusCode, TruncateForUser(raw));
    }

    public async Task<AzureBoardsProjectsHttpResult> ListProjectsAsync(Uri projectsUri, AuthenticationHeaderValue authorization, CancellationToken ct)
    {
        return await GetCollectionAsync(projectsUri, authorization, "projects", ct).ConfigureAwait(false);
    }

    public async Task<AzureBoardsWorkItemTypesHttpResult> ListWorkItemTypesAsync(
        Uri workItemTypesUri,
        AuthenticationHeaderValue authorization,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(workItemTypesUri);
        ArgumentNullException.ThrowIfNull(authorization);

        using HttpRequestMessage request = new(HttpMethod.Get, workItemTypesUri);
        ItsmOutboundHttpAuthorizationHeaders.Apply(request, authorization);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        try
        {
            HttpResponseMessage response = await _http.SendAsync(request, ct).ConfigureAwait(false);
            string raw = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
                return new AzureBoardsWorkItemTypesHttpResult(false, [], response.StatusCode, TruncateForUser(raw));

            AzureBoardsNamedCollectionResponse? parsed =
                JsonSerializer.Deserialize<AzureBoardsNamedCollectionResponse>(raw, ContractJson.CamelCaseIgnoreNullCompact);

            IReadOnlyList<string> names = parsed?.Value?
                .Where(static item => !string.IsNullOrWhiteSpace(item.Name))
                .Select(static item => item.Name!.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(static name => name, StringComparer.OrdinalIgnoreCase)
                .ToList() ?? [];

            return new AzureBoardsWorkItemTypesHttpResult(true, names, response.StatusCode, null);
        }
        catch (Exception ex)
        {
            string detail = ex is OperationCanceledException
                ? "Azure Boards request timed out."
                : "Azure Boards request could not be completed (network error).";

            return new AzureBoardsWorkItemTypesHttpResult(false, [], HttpStatusCode.ServiceUnavailable, detail);
        }
    }

    private async Task<AzureBoardsProjectsHttpResult> GetCollectionAsync(
        Uri requestUri,
        AuthenticationHeaderValue authorization,
        string vendorLabel,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(requestUri);
        ArgumentNullException.ThrowIfNull(authorization);

        using HttpRequestMessage request = new(HttpMethod.Get, requestUri);
        ItsmOutboundHttpAuthorizationHeaders.Apply(request, authorization);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        try
        {
            HttpResponseMessage response = await _http.SendAsync(request, ct).ConfigureAwait(false);
            string raw = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
                return new AzureBoardsProjectsHttpResult(false, [], response.StatusCode, TruncateForUser(raw));

            AzureBoardsNamedCollectionResponse? parsed =
                JsonSerializer.Deserialize<AzureBoardsNamedCollectionResponse>(raw, ContractJson.CamelCaseIgnoreNullCompact);

            IReadOnlyList<string> names = parsed?.Value?
                .Where(static item => !string.IsNullOrWhiteSpace(item.Name))
                .Select(static item => item.Name!.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(static name => name, StringComparer.OrdinalIgnoreCase)
                .ToList() ?? [];

            return new AzureBoardsProjectsHttpResult(true, names, response.StatusCode, null);
        }
        catch (Exception ex)
        {
            string detail = ex is OperationCanceledException
                ? $"{vendorLabel} request timed out."
                : $"{vendorLabel} request could not be completed (network error).";

            return new AzureBoardsProjectsHttpResult(false, [], HttpStatusCode.ServiceUnavailable, detail);
        }
    }

    private static string TruncateForUser(string raw)
    {
        if (string.IsNullOrEmpty(raw))
            return "Azure Boards request failed.";

        return raw.Length <= 2048 ? raw : raw[..2048];
    }

    private sealed record AzureBoardsCreateWorkItemResponse(int Id, string? Url);

    private sealed record AzureBoardsNamedCollectionResponse(IReadOnlyList<AzureBoardsNamedItem>? Value);

    private sealed record AzureBoardsNamedItem(string? Name);
}

public sealed record AzureBoardsOutboundIssueHttpResult(
    bool Ok,
    string? WorkItemId,
    string? RemoteId,
    HttpStatusCode StatusCode,
    string? ErrorDetail);

public sealed record AzureBoardsProjectsHttpResult(
    bool Ok,
    IReadOnlyList<string> ProjectNames,
    HttpStatusCode StatusCode,
    string? ErrorDetail);

public sealed record AzureBoardsWorkItemTypesHttpResult(
    bool Ok,
    IReadOnlyList<string> WorkItemTypeNames,
    HttpStatusCode StatusCode,
    string? ErrorDetail);
