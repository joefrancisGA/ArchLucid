using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Admin;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Prints <c>GET /v1/admin/auth/configuration-diagnostics</c> for OIDC/SAML self-service triage (requires admin API key).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "CLI HTTP orchestration; covered by manual operator workflows.")]
internal static class AuthDiagnosticsCommand
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    public static async Task<int> RunAsync(string[] args, ArchLucidProjectScaffolder.ArchLucidCliConfig? config)
    {
        string baseUrl = ArchLucidApiClient.ResolveBaseUrl(config);
        string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(baseUrl);

        if (urlError is not null)
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] " + urlError);

            return CliExitCode.ConfigurationError;
        }

        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            await Console.Error.WriteLineAsync(
                "[ArchLucid CLI] Set ARCHLUCID_API_KEY with AdminAuthority before running auth diagnostics.");

            return CliExitCode.ConfigurationError;
        }

        using HttpClient httpClient = new() { BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/") };
        using HttpRequestMessage request = new(HttpMethod.Get, "v1/admin/auth/configuration-diagnostics");
        request.Headers.Add("X-Api-Key", apiKey);

        using HttpResponseMessage response = await httpClient.SendAsync(request).ConfigureAwait(false);
        string body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            await Console.Error.WriteLineAsync(
                $"[ArchLucid CLI] GET configuration-diagnostics failed: HTTP {(int)response.StatusCode}");
            await Console.Error.WriteLineAsync(body);

            return CliExitCode.OperationFailed;
        }

        AdminAuthConfigurationDiagnosticsResponse? parsed =
            JsonSerializer.Deserialize<AdminAuthConfigurationDiagnosticsResponse>(body, JsonOptions);

        if (parsed is null)
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] Could not parse configuration-diagnostics JSON.");

            return CliExitCode.OperationFailed;
        }

        PrintReport(parsed);

        return CliExitCode.Success;
    }

    public static void WriteUsage()
    {
        Console.WriteLine("Usage: archlucid auth diagnostics [--api-base-url <url>]");
        Console.WriteLine();
        Console.WriteLine("Requires ARCHLUCID_API_KEY with AdminAuthority and a reachable API.");
        Console.WriteLine("Docs: docs/runbooks/GENERIC_OIDC_SETUP.md, docs/runbooks/FIRST_PILOT_TROUBLESHOOTING.md");
    }

    private static void PrintReport(AdminAuthConfigurationDiagnosticsResponse parsed)
    {
        Console.WriteLine("ArchLucid auth configuration diagnostics");
        Console.WriteLine();
        Console.WriteLine($"Auth mode:                      {parsed.AuthMode}");
        Console.WriteLine($"Audience configured:            {YesNo(parsed.AudienceConfigured)}");
        Console.WriteLine($"Issuer/authority configured:    {YesNo(parsed.IssuerOrAuthorityConfigured)}");
        Console.WriteLine($"OpenID discovery succeeded:     {TriState(parsed.OpenIdDiscoverySucceeded)}");
        Console.WriteLine($"SAML2 enabled:                  {YesNo(parsed.Saml2Enabled)}");
        Console.WriteLine($"SP entity id configured:        {TriState(parsed.SpEntityIdConfigured)}");
        Console.WriteLine($"SAML role claim sources:        {TriState(parsed.SamlRoleClaimSourcesConfigured)}");
        Console.WriteLine($"Tenant claim mapping configured:{TriState(parsed.TenantClaimMappingConfigured)}");

        if (!string.IsNullOrWhiteSpace(parsed.TenantIdentityProviderProtocol))
            Console.WriteLine($"Tenant IdP protocol:            {parsed.TenantIdentityProviderProtocol}");

        Console.WriteLine();

        if (parsed.MisconfigurationHints.Count == 0)
        {
            Console.WriteLine("No misconfiguration hints — review GET /v1/admin/auth/oidc-diagnostics for discovery endpoints.");

            return;
        }

        Console.WriteLine("Misconfiguration hints:");

        foreach (string hint in parsed.MisconfigurationHints)
            Console.WriteLine($" • {hint}");
    }

    private static string YesNo(bool value) => value ? "yes" : "no";

    private static string TriState(bool? value) =>
        value switch
        {
            true => "yes",
            false => "no",
            null => "n/a",
        };
}
