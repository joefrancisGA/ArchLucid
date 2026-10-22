using System.Net;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration.Summary;

namespace ArchLucid.Cli.Commands;

internal static partial class ConfigCheckCommand
{
    private static async Task<(IReadOnlyDictionary<string, bool>?, string?)> TryFetchApiSummaryAsync(
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        CancellationToken cancellationToken)
    {
        string baseUrl = ArchLucidApiClient.ResolveBaseUrl(config);
        if (ArchLucidApiClient.GetInvalidApiBaseUrlReason(baseUrl) is { } err)
        {
            return (null, "API: (skip) " + err);
        }

        string? k = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");
        if (string.IsNullOrWhiteSpace(k))
        {
            return (null, "API: (skip) set ARCHLUCID_API_KEY (Admin) to merge GET /v1/admin/config-summary presence.");
        }

        using HttpClient c = new();
        c.BaseAddress = new Uri(
            baseUrl
                .Trim()
                .TrimEnd('/') + "/", UriKind.Absolute);
        c.Timeout = TimeSpan.FromSeconds(20);
        c.DefaultRequestHeaders.Add("X-Api-Key", k);
        c.DefaultRequestHeaders.Add("Accept", "application/json");

        try
        {
            using HttpResponseMessage r = await c
                .GetAsync("v1/admin/config-summary", cancellationToken)
                .ConfigureAwait(false);
            if (r.StatusCode == HttpStatusCode.Unauthorized)
            {
                return (null, "API: 401 (Admin).");
            }

            if (r.StatusCode == HttpStatusCode.NotFound)
            {
                return (null, "API: 404 (this server build has no /v1/admin/config-summary).");
            }

            r.EnsureSuccessStatusCode();
            string body = await r.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            AdminConfigSummaryResponse? d = JsonSerializer.Deserialize<AdminConfigSummaryResponse>(
                body,
                ContractJson.CamelCaseDeserializeCaseInsensitive);
            if (d?.Keys is not { } rows || rows.Count == 0)
                return (null, "API: (skip) empty body");

            IReadOnlyDictionary<string, bool> m = rows
                .Where(static r => !string.IsNullOrEmpty(r.ConfigPath))
                .ToDictionary(
                    static r => r.ConfigPath!, static r => r.IsSet, StringComparer.OrdinalIgnoreCase);
            return (m, "API: merged key presence (non-secret) from GET /v1/admin/config-summary.");
        }
        catch (Exception ex)
        {
            return (null, "API: (skip) " + ex.GetType().Name);
        }
    }
}
