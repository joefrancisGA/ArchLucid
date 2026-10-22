using System.Net.Http.Headers;
using System.Text;

using ArchLucid.Contracts.Abstractions.Integrations;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Integrations.AzureDevOps;

/// <summary>
///     Posts commit success/failure PR statuses when <see cref="AzureDevOpsIntegrationOptions.Enabled" /> (Improvement #12).
/// </summary>
public sealed class AzureDevOpsCommitStatusPublisher(
    IHttpClientFactory httpClientFactory,
    IOptions<AzureDevOpsIntegrationOptions> options,
    ILogger<AzureDevOpsCommitStatusPublisher> logger) : IAzureDevOpsCommitStatusPublisher
{
    /// <summary>Named <see cref="HttpClient" /> key registered in Host.Composition.</summary>
    public const string HttpClientName = nameof(AzureDevOpsCommitStatusPublisher);

    private readonly IHttpClientFactory _httpClientFactory =
        httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));

    private readonly IOptions<AzureDevOpsIntegrationOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<AzureDevOpsCommitStatusPublisher> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task PublishCommitOutcomeAsync(Guid runId, bool succeeded, CancellationToken cancellationToken)
    {
        AzureDevOpsIntegrationOptions o = _options.Value;

        if (!o.Enabled)
            return;

        if (o.RepositoryId == Guid.Empty || o.PullRequestId <= 0)
        {
            if (_logger.IsEnabled(LogLevel.Debug))
                _logger.LogDebug("Azure DevOps commit status skipped: RepositoryId or PullRequestId not set.");

            return;
        }

        if (string.IsNullOrWhiteSpace(o.Organization)
            || string.IsNullOrWhiteSpace(o.Project)
            || string.IsNullOrWhiteSpace(o.PersonalAccessToken))
        {
            if (_logger.IsEnabled(LogLevel.Debug))
                _logger.LogDebug("Azure DevOps commit status skipped: organization, project, or PAT not configured.");

            return;
        }

        string org = o.Organization.Trim();
        string project = o.Project.Trim();
        string basePath =
            $"https://dev.azure.com/{Uri.EscapeDataString(org)}/{Uri.EscapeDataString(project)}/_apis/git/repositories/{o.RepositoryId:D}/pullrequests/{o.PullRequestId}";

        string? targetUrl = BuildOperatorRunDeepLink(o.StatusTargetUrl, runId);
        string description = succeeded
            ? $"ArchLucid manifest commit succeeded for run {runId:D}."
            : $"ArchLucid manifest commit failed for run {runId:D}.";

        string state = succeeded ? "succeeded" : "failed";
        string url = $"{basePath}/statuses?api-version=7.1";
        string json = AzureDevOpsPullRequestWireFormat.SerializeStatusCreate(description, targetUrl, state);
        string pat = o.PersonalAccessToken.Trim();

        try
        {
            HttpClient client = _httpClientFactory.CreateClient(HttpClientName);
            using HttpRequestMessage request = new(HttpMethod.Post, new Uri(url, UriKind.Absolute));
            request.Headers.Authorization = new AuthenticationHeaderValue(
                "Basic",
                Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}")));
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            using HttpResponseMessage response = await client.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                string err = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        "Azure DevOps commit status POST failed for RunId={RunId}: {StatusCode} {Body}",
                        runId,
                        (int)response.StatusCode,
                        err.Length > 512 ? err[..512] : err);
                }
            }
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Azure DevOps commit status POST threw for RunId={RunId}; continuing.", runId);
        }
    }

    private static string? BuildOperatorRunDeepLink(string? statusTargetBase, Guid runId)
    {
        if (string.IsNullOrWhiteSpace(statusTargetBase))
            return null;

        string b = statusTargetBase.Trim().TrimEnd('/');

        return $"{b}/runs/{runId:D}";
    }
}
