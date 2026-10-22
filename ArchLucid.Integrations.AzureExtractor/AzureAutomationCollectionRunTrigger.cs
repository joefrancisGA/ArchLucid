using System.Net.Http.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.SecureNow;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;

using Azure.Core;

using Microsoft.Extensions.Options;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
/// Starts the customer-owned Automation runbook through the single ADR 0103 control-plane write.
/// </summary>
public sealed class AzureAutomationCollectionRunTrigger(
    HttpClient httpClient,
    IHostedAzureExtractorCredentialFactory credentialFactory,
    ITenantHostedExtractorConfigurationRepository configurationRepository,
    IOptionsMonitor<HostedAzureExtractorOptions> optionsMonitor) : ICollectionRunTrigger
{
    private const string ManagementScope = "https://management.azure.com/.default";
    private const string ApiVersion = "2023-11-01";

    private readonly HttpClient _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
    private readonly IHostedAzureExtractorCredentialFactory _credentialFactory =
        credentialFactory ?? throw new ArgumentNullException(nameof(credentialFactory));
    private readonly ITenantHostedExtractorConfigurationRepository _configurationRepository =
        configurationRepository ?? throw new ArgumentNullException(nameof(configurationRepository));
    private readonly IOptionsMonitor<HostedAzureExtractorOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    public async Task<CollectionRunTriggerResult> TriggerAsync(
        ScopeContext scope,
        CollectionRunTriggerRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        HostedAzureExtractorOptions options = _optionsMonitor.CurrentValue;
        ValidateOptions(options);

        TenantHostedExtractorConfigurationRecord configuration =
            await ResolveConfigurationAsync(scope.TenantId, request.SubscriptionIds, cancellationToken);
        TokenCredential credential = _credentialFactory.CreateCredential(
            configuration.CustomerTenantId,
            configuration.CustomerAppId);
        AccessToken accessToken = await credential.GetTokenAsync(
            new TokenRequestContext([ManagementScope]),
            cancellationToken);

        string endpoint = BuildStartEndpoint(options);
        using HttpRequestMessage message = new(HttpMethod.Post, endpoint)
        {
            Content = JsonContent.Create(new
            {
                properties = new
                {
                    parameters = new
                    {
                        runId = request.RunId.ToString("D"),
                        subscriptionIds = configuration.SubscriptionId,
                        edition = "generic",
                    },
                },
            }),
        };
        message.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken.Token);

        using HttpResponseMessage response = await _httpClient.SendAsync(message, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            string detail = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException(
                $"Azure Automation runbook start failed with {(int)response.StatusCode} {response.ReasonPhrase}: {detail}");
        }

        return new CollectionRunTriggerResult
        {
            Schedule = null,
        };
    }

    private async Task<TenantHostedExtractorConfigurationRecord> ResolveConfigurationAsync(
        Guid tenantId,
        IReadOnlyList<string> requestedSubscriptionIds,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<TenantHostedExtractorConfigurationRecord> configurations =
            await _configurationRepository.ListByTenantAsync(tenantId, cancellationToken);

        TenantHostedExtractorConfigurationRecord? configuration = configurations
            .OrderBy(static item => item.UpdatedUtc)
            .LastOrDefault();

        if (configuration is null)
        {
            throw new InvalidOperationException("SecureNow collection is not configured for this tenant.");
        }

        string[] requested = requestedSubscriptionIds
            .Where(static subscriptionId => !string.IsNullOrWhiteSpace(subscriptionId))
            .Select(static subscriptionId => subscriptionId.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (requested.Length > 0 && requested.Any(subscriptionId =>
                !subscriptionId.Equals(configuration.SubscriptionId, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException("The requested subscription is not configured for this tenant.");
        }

        return configuration;
    }

    private static void ValidateOptions(HostedAzureExtractorOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (!options.Enabled)
        {
            throw new InvalidOperationException("Hosted Azure collection is disabled.");
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(options.AutomationSubscriptionId);
        ArgumentException.ThrowIfNullOrWhiteSpace(options.AutomationResourceGroupName);
        ArgumentException.ThrowIfNullOrWhiteSpace(options.AutomationAccountName);
        ArgumentException.ThrowIfNullOrWhiteSpace(options.AutomationRunbookName);
    }

    private static string BuildStartEndpoint(HostedAzureExtractorOptions options)
    {
        return $"https://management.azure.com/subscriptions/{Uri.EscapeDataString(options.AutomationSubscriptionId!.Trim())}" +
            $"/resourceGroups/{Uri.EscapeDataString(options.AutomationResourceGroupName!.Trim())}" +
            $"/providers/Microsoft.Automation/automationAccounts/{Uri.EscapeDataString(options.AutomationAccountName!.Trim())}" +
            $"/runbooks/{Uri.EscapeDataString(options.AutomationRunbookName!.Trim())}/start?api-version={ApiVersion}";
    }
}
