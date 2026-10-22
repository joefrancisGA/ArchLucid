using System.Net.Http.Headers;

using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integrations.Itsm;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public sealed partial class ItsmOutboundIntegrationHealthService
{
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

    private static Uri BuildJiraMyselfUri(string cloudBaseUrl)
    {
        string trimmed = cloudBaseUrl.Trim().TrimEnd('/');
        Uri root = new($"{trimmed}/", UriKind.Absolute);

        return new Uri(root, "rest/api/3/myself");
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

    private static string TruncateDetail(string raw)
    {
        if (string.IsNullOrEmpty(raw))
            return string.Empty;

        return raw.Length <= 512 ? raw : $"{raw[..512]}…";
    }
}
