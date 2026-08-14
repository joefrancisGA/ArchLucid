using System.Net.Http.Headers;
using System.Text;

using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
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
public sealed class ItsmOutboundIntegrationHealthService(
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

    private async Task<(
        TenantItsmOutboundSettings? TenantRow,
        IntegrationsItsmOutboundOptions Outbound,
        ResolvedItsmOutboundCredentials? JiraCredentials,
        ResolvedItsmOutboundCredentials? SnowCredentials)> LoadScopeCredentialsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        TenantItsmOutboundSettings? tenantRow =
            await _tenantItsmOutboundSettings.TryGetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        IntegrationsItsmOutboundOptions outbound = _outboundOptions.CurrentValue;

        ResolvedItsmOutboundCredentials? jiraCredentials = await _credentialResolver
            .TryResolveOutboundAsync(scope.TenantId, TenantItsmConnectorProvider.Jira, cancellationToken)
            .ConfigureAwait(false);

        ResolvedItsmOutboundCredentials? snowCredentials = await _credentialResolver
            .TryResolveOutboundAsync(scope.TenantId, TenantItsmConnectorProvider.ServiceNow, cancellationToken)
            .ConfigureAwait(false);

        return (tenantRow, outbound, jiraCredentials, snowCredentials);
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

    private async Task<ItsmOutboundIntegrationProviderProbe> BuildJiraProbeAsync(
        HttpClient http,
        Guid tenantId,
        ResolvedItsmOutboundCredentials? credentials,
        ItsmOutboundLocalReadiness local,
        CancellationToken ct)
    {
        if (!local.IsReady)
            return new ItsmOutboundIntegrationProviderProbe(false, null, local.Summary);

        if (credentials is null)
            return new ItsmOutboundIntegrationProviderProbe(false, null, local.Summary);

        Uri myselfUri = BuildJiraMyselfUri(credentials.InstanceBaseUrl);
        (bool ok, string detail) =
            await ProbeGetWithAuthorizationAsync(
                    http,
                    myselfUri,
                    tenantId,
                    TenantItsmConnectorProvider.Jira,
                    credentials,
                    "Jira",
                    ct)
                .ConfigureAwait(false);

        if (!ok && _logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning("ITSM health probe: Jira unreachable ({Detail}).", LogSanitizer.Sanitize(detail));

        string summary = ok ? "Jira REST reachable (GET /rest/api/3/myself)." : detail;

        return new ItsmOutboundIntegrationProviderProbe(true, ok, summary);
    }

    private async Task<ItsmOutboundIntegrationProviderProbe> BuildServiceNowProbeAsync(
        HttpClient http,
        Guid tenantId,
        ResolvedItsmOutboundCredentials? credentials,
        ItsmOutboundLocalReadiness local,
        CancellationToken ct)
    {
        if (!local.IsReady)
            return new ItsmOutboundIntegrationProviderProbe(false, null, local.Summary);

        if (credentials is null)
            return new ItsmOutboundIntegrationProviderProbe(false, null, local.Summary);

        Uri incidentProbeUri = BuildServiceNowIncidentProbeUri(credentials.InstanceBaseUrl);

        (bool ok, string detail) = await ProbeGetWithAuthorizationAsync(
                http,
                incidentProbeUri,
                tenantId,
                TenantItsmConnectorProvider.ServiceNow,
                credentials,
                "ServiceNow",
                ct)
            .ConfigureAwait(false);

        if (!ok && _logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning("ITSM health probe: ServiceNow unreachable ({Detail}).", LogSanitizer.Sanitize(detail));

        string summary = ok
            ? "ServiceNow Table API reachable (GET incident with sysparm_limit=1)."
            : detail;

        return new ItsmOutboundIntegrationProviderProbe(true, ok, summary);
    }

    private async Task<(bool Ok, string Detail)> ProbeGetWithAuthorizationAsync(
        HttpClient http,
        Uri requestUri,
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        ResolvedItsmOutboundCredentials credentials,
        string vendorLabel,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(http);
        ArgumentNullException.ThrowIfNull(requestUri);
        ArgumentNullException.ThrowIfNull(credentials);

        AuthenticationHeaderValue? authorization = await _httpAuthenticator.TryCreateAuthorizationHeaderAsync(
            tenantId,
            provider,
            credentials,
            ct).ConfigureAwait(false);

        if (authorization is null)
            return (false, $"{vendorLabel} credentials could not be authorized for the health probe.");

        using HttpRequestMessage request = new(HttpMethod.Get, requestUri);
        ItsmOutboundHttpAuthorizationHeaders.Apply(request, authorization);

        try
        {
            HttpResponseMessage response = await http.SendAsync(request, ct).ConfigureAwait(false);

            if (response.IsSuccessStatusCode)
                return (true, string.Empty);

            string raw = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

            return (false,
                $"{vendorLabel} returned {(int)response.StatusCode} {response.ReasonPhrase}: {TruncateDetail(raw)}".Trim());
        }
        catch (Exception ex) when (ex is OperationCanceledException or HttpRequestException or TaskCanceledException)
        {
            string detail = ex is OperationCanceledException
                ? $"{vendorLabel} health probe timed out."
                : $"{vendorLabel} health probe failed (network error).";

            return (false, detail);
        }
        catch (Exception ex)
        {
            return (false, $"{vendorLabel} health probe failed unexpectedly: {ex.Message}");
        }
    }

    private static Uri BuildJiraMyselfUri(string cloudBaseUrl)
    {
        string trimmed = cloudBaseUrl.Trim().TrimEnd('/');
        Uri root = new($"{trimmed}/", UriKind.Absolute);

        return new Uri(root, "rest/api/3/myself");
    }

    private static Uri BuildServiceNowIncidentProbeUri(string instanceBaseUrl)
    {
        string trimmed = instanceBaseUrl.Trim().TrimEnd('/');
        Uri root = new($"{trimmed}/", UriKind.Absolute);

        return new Uri(root, "api/now/table/incident?sysparm_limit=1");
    }

    private static string TruncateDetail(string raw)
    {
        if (string.IsNullOrEmpty(raw))
            return string.Empty;

        return raw.Length <= 512 ? raw : $"{raw[..512]}…";
    }
}
