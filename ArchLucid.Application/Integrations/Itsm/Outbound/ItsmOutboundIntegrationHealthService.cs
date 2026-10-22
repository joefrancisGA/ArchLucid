using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>
///     Loads <see cref="TenantItsmOutboundSettings" /> for <paramref name="scope" /> then probes configured vendors with
///     read-only REST calls (Jira <c>/rest/api/3/myself</c>, ServiceNow incident table with <c>sysparm_limit=1</c>).
/// </summary>
public sealed partial class ItsmOutboundIntegrationHealthService(
    IHttpClientFactory httpClientFactory,
    IOptionsMonitor<IntegrationsItsmOutboundOptions> outboundOptions,
    ITenantItsmOutboundSettingsRepository tenantItsmOutboundSettings,
    IItsmTenantConnectorCredentialResolver credentialResolver,
    IItsmOutboundHttpAuthenticator httpAuthenticator,
    ILogger<ItsmOutboundIntegrationHealthService> logger) : IItsmOutboundIntegrationHealthService
{
    private const string HealthyStatus = "healthy";
    private const string NotConfiguredStatus = "not_configured";
    private const string NotTestedStatus = "not_tested";
    private const string UnhealthyStatus = "unhealthy";

    private readonly IHttpClientFactory _httpClientFactory =
        httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));

    private readonly IOptionsMonitor<IntegrationsItsmOutboundOptions> _outboundOptions =
        outboundOptions ?? throw new ArgumentNullException(nameof(outboundOptions));

    private readonly ITenantItsmOutboundSettingsRepository _tenantItsmOutboundSettings =
        tenantItsmOutboundSettings ?? throw new ArgumentNullException(nameof(tenantItsmOutboundSettings));

    private readonly IItsmTenantConnectorCredentialResolver _credentialResolver =
        credentialResolver ?? throw new ArgumentNullException(nameof(credentialResolver));

    private readonly IItsmOutboundHttpAuthenticator _httpAuthenticator =
        httpAuthenticator ?? throw new ArgumentNullException(nameof(httpAuthenticator));

    private readonly ILogger<ItsmOutboundIntegrationHealthService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<ItsmOutboundIntegrationHealthReport> GetHealthAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        (TenantItsmOutboundSettings? tenantRow,
            IntegrationsItsmOutboundOptions outbound,
            ResolvedItsmOutboundCredentials? jiraCredentials,
            ResolvedItsmOutboundCredentials? snowCredentials) =
            await LoadScopeCredentialsAsync(scope, cancellationToken).ConfigureAwait(false);

        HttpClient http = _httpClientFactory.CreateClient(ItsmOutboundIntegrationHealthLimits.HttpClientName);

        ItsmOutboundLocalReadiness jiraLocal =
            ItsmOutboundLocalConfigurationEvaluator.EvaluateJiraFromResolvedCredentials(jiraCredentials, outbound, tenantRow);

        ItsmOutboundLocalReadiness snowLocal =
            ItsmOutboundLocalConfigurationEvaluator.EvaluateServiceNowFromResolvedCredentials(snowCredentials, outbound);

        ItsmOutboundIntegrationProviderProbe jiraProbe =
            await BuildJiraProbeAsync(http, scope.TenantId, jiraCredentials, jiraLocal, cancellationToken).ConfigureAwait(false);

        ItsmOutboundIntegrationProviderProbe snowProbe =
            await BuildServiceNowProbeAsync(http, scope.TenantId, snowCredentials, snowLocal, cancellationToken).ConfigureAwait(false);

        return BuildLiveReport(jiraProbe, snowProbe);
    }

    /// <inheritdoc />
    public async Task<ItsmOutboundIntegrationHealthReport> GetStoredHealthAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        (TenantItsmOutboundSettings? tenantRow,
            IntegrationsItsmOutboundOptions outbound,
            ResolvedItsmOutboundCredentials? jiraCredentials,
            ResolvedItsmOutboundCredentials? snowCredentials) =
            await LoadScopeCredentialsAsync(scope, cancellationToken).ConfigureAwait(false);

        ItsmOutboundLocalReadiness jiraLocal =
            ItsmOutboundLocalConfigurationEvaluator.EvaluateJiraFromResolvedCredentials(jiraCredentials, outbound, tenantRow);

        ItsmOutboundLocalReadiness snowLocal =
            ItsmOutboundLocalConfigurationEvaluator.EvaluateServiceNowFromResolvedCredentials(snowCredentials, outbound);

        ItsmOutboundIntegrationProviderProbe jiraProbe = BuildStoredProbe(jiraLocal);
        ItsmOutboundIntegrationProviderProbe snowProbe = BuildStoredProbe(snowLocal);

        return BuildStoredReport(jiraProbe, snowProbe);
    }

    private static ItsmOutboundIntegrationProviderProbe BuildStoredProbe(ItsmOutboundLocalReadiness local)
    {
        if (!local.IsReady)
            return new ItsmOutboundIntegrationProviderProbe(false, null, local.Summary);

        return new ItsmOutboundIntegrationProviderProbe(true, null, local.Summary);
    }

    private static ItsmOutboundIntegrationHealthReport BuildLiveReport(
        ItsmOutboundIntegrationProviderProbe jiraProbe,
        ItsmOutboundIntegrationProviderProbe snowProbe)
    {
        bool anyConfigured = jiraProbe.LocallyConfigured || snowProbe.LocallyConfigured;

        bool upstreamFailure = (jiraProbe.LocallyConfigured && jiraProbe.Reachable is false) ||
                               (snowProbe.LocallyConfigured && snowProbe.Reachable is false);

        string status;

        if (!anyConfigured)
            status = NotConfiguredStatus;
        else if (upstreamFailure)
            status = UnhealthyStatus;
        else
            status = HealthyStatus;

        return new ItsmOutboundIntegrationHealthReport(status, jiraProbe, snowProbe,
            Return503: anyConfigured && upstreamFailure);
    }

    private static ItsmOutboundIntegrationHealthReport BuildStoredReport(
        ItsmOutboundIntegrationProviderProbe jiraProbe,
        ItsmOutboundIntegrationProviderProbe snowProbe)
    {
        bool anyConfigured = jiraProbe.LocallyConfigured || snowProbe.LocallyConfigured;

        string status = anyConfigured ? NotTestedStatus : NotConfiguredStatus;

        return new ItsmOutboundIntegrationHealthReport(status, jiraProbe, snowProbe, Return503: false);
    }
}
