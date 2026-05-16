using System.Net.Http.Headers;
using System.Text;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
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
    ILogger<ItsmOutboundIntegrationHealthService> logger) : IItsmOutboundIntegrationHealthService
{
    private const string HealthyStatus = "healthy";
    private const string NotConfiguredStatus = "not_configured";
    private const string UnhealthyStatus = "unhealthy";

    private readonly IHttpClientFactory _httpClientFactory =
        httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));

    private readonly IOptionsMonitor<IntegrationsItsmOutboundOptions> _outboundOptions =
        outboundOptions ?? throw new ArgumentNullException(nameof(outboundOptions));

    private readonly ITenantItsmOutboundSettingsRepository _tenantItsmOutboundSettings =
        tenantItsmOutboundSettings ?? throw new ArgumentNullException(nameof(tenantItsmOutboundSettings));

    private readonly ILogger<ItsmOutboundIntegrationHealthService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<ItsmOutboundIntegrationHealthReport> GetHealthAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        HttpClient http = _httpClientFactory.CreateClient(ItsmOutboundIntegrationHealthLimits.HttpClientName);

        TenantItsmOutboundSettings? tenantRow =
            await _tenantItsmOutboundSettings.TryGetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        IntegrationsItsmOutboundOptions outbound = _outboundOptions.CurrentValue;

        ItsmOutboundLocalReadiness jiraLocal =
            ItsmOutboundLocalConfigurationEvaluator.EvaluateJira(outbound, tenantRow);

        ItsmOutboundLocalReadiness snowLocal = ItsmOutboundLocalConfigurationEvaluator.EvaluateServiceNow(outbound);

        ItsmOutboundIntegrationProviderProbe jiraProbe =
            await BuildJiraProbeAsync(http, outbound, jiraLocal, cancellationToken).ConfigureAwait(false);

        ItsmOutboundIntegrationProviderProbe snowProbe =
            await BuildServiceNowProbeAsync(http, outbound, snowLocal, cancellationToken).ConfigureAwait(false);

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

    private async Task<ItsmOutboundIntegrationProviderProbe> BuildJiraProbeAsync(HttpClient http,
        IntegrationsItsmOutboundOptions outbound, ItsmOutboundLocalReadiness local, CancellationToken ct)
    {
        if (!local.IsReady)
            return new ItsmOutboundIntegrationProviderProbe(false, null, local.Summary);

        Uri myselfUri = BuildJiraMyselfUri(outbound.Jira.CloudBaseUrl);
        (bool ok, string detail) =
            await ProbeGetWithBasicAuthAsync(http, myselfUri, outbound.Jira.ServiceAccountEmail, outbound.Jira.ApiToken, "Jira", ct)
                .ConfigureAwait(false);

        if (!ok && _logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning("ITSM health probe: Jira unreachable ({Detail}).", LogSanitizer.Sanitize(detail));

        string summary = ok ? "Jira REST reachable (GET /rest/api/3/myself)." : detail;

        return new ItsmOutboundIntegrationProviderProbe(true, ok, summary);
    }

    private async Task<ItsmOutboundIntegrationProviderProbe> BuildServiceNowProbeAsync(HttpClient http,
        IntegrationsItsmOutboundOptions outbound, ItsmOutboundLocalReadiness local, CancellationToken ct)
    {
        if (!local.IsReady)
            return new ItsmOutboundIntegrationProviderProbe(false, null, local.Summary);

        Uri incidentProbeUri = BuildServiceNowIncidentProbeUri(outbound.ServiceNow.InstanceBaseUrl);

        (bool ok, string detail) = await ProbeGetWithBasicAuthAsync(
                http,
                incidentProbeUri,
                outbound.ServiceNow.Username,
                outbound.ServiceNow.Password,
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

    private static async Task<(bool Ok, string Detail)> ProbeGetWithBasicAuthAsync(HttpClient http, Uri requestUri,
        string username, string password, string vendorLabel, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(http);
        ArgumentNullException.ThrowIfNull(requestUri);

        using HttpRequestMessage request = new(HttpMethod.Get, requestUri);
        string token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", token);

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
