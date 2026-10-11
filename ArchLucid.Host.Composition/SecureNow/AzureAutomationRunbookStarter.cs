using System.Net;
using System.Net.Http.Json;

using ArchLucid.Application.SecureNow;

using Azure.Core;
using Azure.Identity;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.SecureNow;

public sealed class AzureAutomationRunbookStarter(
    HttpClient httpClient,
    IOptions<AutomationRunbookOptions> options,
    ILogger<AzureAutomationRunbookStarter> logger) : IAutomationRunbookStarter
{
    private readonly TokenCredential _credential = new DefaultAzureCredential();
    private readonly AutomationRunbookOptions _options = options?.Value ?? throw new ArgumentNullException(nameof(options));

    public async Task<bool> StartAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        string actor,
        CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled ||
            string.IsNullOrWhiteSpace(_options.SubscriptionId) ||
            string.IsNullOrWhiteSpace(_options.ResourceGroupName) ||
            string.IsNullOrWhiteSpace(_options.AutomationAccountName) ||
            string.IsNullOrWhiteSpace(_options.RunbookName))
            return false;

        AccessToken token = await _credential.GetTokenAsync(
            new TokenRequestContext(["https://management.azure.com/.default"]),
            cancellationToken);
        string jobName = runId.ToString("N");
        string endpoint =
            $"https://management.azure.com/subscriptions/{Uri.EscapeDataString(_options.SubscriptionId)}/resourceGroups/{Uri.EscapeDataString(_options.ResourceGroupName)}/providers/Microsoft.Automation/automationAccounts/{Uri.EscapeDataString(_options.AutomationAccountName)}/jobs/{jobName}?api-version={Uri.EscapeDataString(_options.ApiVersion)}";
        using HttpRequestMessage request = new(HttpMethod.Put, endpoint);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token.Token);
        request.Content = JsonContent.Create(new
        {
            properties = new
            {
                runbook = new { name = _options.RunbookName },
                parameters = new
                {
                    runId = runId.ToString("D"),
                    tenantId = tenantId.ToString("D"),
                    workspaceId = workspaceId.ToString("D"),
                    projectId = projectId.ToString("D"),
                },
            },
        });

        using HttpResponseMessage response = await httpClient.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Accepted)
            return true;

        logger.LogWarning(
            "SecureNow collection Automation job start failed with status {StatusCode}.",
            (int)response.StatusCode);
        return false;
    }
}
