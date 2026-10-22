using ArchLucid.Core.Auth.Saml;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

/// <summary>Offline SSO/OIDC/SAML configuration preflight (assessment improvement #13).</summary>
internal static class AuthSsoPreflightEvaluator
{
    private static readonly HttpClient DefaultHttp = new() { Timeout = TimeSpan.FromSeconds(20) };

    internal static async Task<IReadOnlyList<AuthSsoPreflightCheckResult>> EvaluateAsync(
        IConfiguration configuration,
        string contentRoot,
        HttpClient? httpClient = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentException.ThrowIfNullOrWhiteSpace(contentRoot);

        HttpClient http = httpClient ?? DefaultHttp;
        List<AuthSsoPreflightCheckResult> results = [];

        string authMode = AuthSsoPreflightConfigurationReader.ResolveAuthValue(configuration, "Mode") ?? "(unset)";
        results.Add(new AuthSsoPreflightCheckResult("auth.mode", AuthSsoPreflightCheckStatus.Info, $"Configured mode: {authMode}"));

        bool apiKeyEnabled = configuration.GetValue("Authentication:ApiKey:Enabled", false);
        results.Add(new AuthSsoPreflightCheckResult(
            "auth.apiKey",
            apiKeyEnabled ? AuthSsoPreflightCheckStatus.Pass : AuthSsoPreflightCheckStatus.Info,
            apiKeyEnabled ? "ApiKey authentication is enabled in merged configuration." : "API key auth disabled in merged configuration."));

        if (string.Equals(authMode, "DevelopmentBypass", StringComparison.OrdinalIgnoreCase))
        {
            results.Add(new AuthSsoPreflightCheckResult(
                "auth.developmentBypass",
                AuthSsoPreflightCheckStatus.Warn,
                "DevelopmentBypass is enabled — not valid for production-like enterprise handoff."));
        }

        AppendJwtBearerChecks(configuration, results);
        await AppendOidcMetadataCheckAsync(configuration, http, results, cancellationToken).ConfigureAwait(false);
        await AppendSamlChecksAsync(configuration, contentRoot, http, results, cancellationToken).ConfigureAwait(false);
        AppendScimChecks(configuration, results);
        AppendKeyVaultReferenceChecks(configuration, results);

        return results;
    }

    private static void AppendJwtBearerChecks(IConfiguration configuration, List<AuthSsoPreflightCheckResult> results)
    {
        string? authority = AuthSsoPreflightConfigurationReader.ResolveAuthValue(configuration, "Authority");
        string? audience = AuthSsoPreflightConfigurationReader.ResolveAuthValue(configuration, "Audience")
            ?? AuthSsoPreflightConfigurationReader.ResolveAuthValue(configuration, "JwtLocalAudience");
        string? roleClaim = AuthSsoPreflightConfigurationReader.ResolveAuthValue(configuration, "RoleClaimName")
            ?? configuration["ArchLucidAuth:RoleClaimType"]?.Trim();

        results.Add(PresenceCheck("oidc.authority", authority, "ArchLucidAuth:Authority"));
        results.Add(PresenceCheck("oidc.audience", audience, "ArchLucidAuth:Audience"));
        results.Add(PresenceCheck("oidc.roleClaim", roleClaim, "ArchLucidAuth:RoleClaimName"));
    }

    private static async Task AppendOidcMetadataCheckAsync(
        IConfiguration configuration,
        HttpClient http,
        List<AuthSsoPreflightCheckResult> results,
        CancellationToken cancellationToken)
    {
        AuthSsoPreflightOidcProbe.ProbeResult probe = await AuthSsoPreflightOidcProbe
            .ProbeAsync(configuration, http, cancellationToken)
            .ConfigureAwait(false);

        if (!probe.IsApplicable)
            return;

        results.Add(new AuthSsoPreflightCheckResult(
            "oidc.metadataReachability",
            probe.Succeeded ? AuthSsoPreflightCheckStatus.Pass : AuthSsoPreflightCheckStatus.Fail,
            probe.Detail));
    }

    private static async Task AppendSamlChecksAsync(
        IConfiguration configuration,
        string contentRoot,
        HttpClient http,
        List<AuthSsoPreflightCheckResult> results,
        CancellationToken cancellationToken)
    {
        bool samlEnabled = configuration.GetValue("ArchLucidAuth:Saml2:Enabled", false);

        if (!samlEnabled)
        {
            results.Add(new AuthSsoPreflightCheckResult(
                "saml.enabled",
                AuthSsoPreflightCheckStatus.Info,
                "SAML SP mode disabled (ArchLucidAuth:Saml2:Enabled=false)."));

            return;
        }

        SamlSpConfigurationSnapshot snapshot = configuration
                .GetSection(SamlSpConfigurationSnapshot.ConfigurationSectionPath)
                .Get<SamlSpConfigurationSnapshot>()
            ?? new SamlSpConfigurationSnapshot();

        IReadOnlyList<SamlTestConfigComponentResult> samlResults = await SamlSpConfigurationDiagnostics
            .EvaluateAsync(snapshot, contentRoot, http, cancellationToken)
            .ConfigureAwait(false);

        foreach (SamlTestConfigComponentResult row in samlResults)
        {
            AuthSsoPreflightCheckStatus status = row.Status switch
            {
                SamlTestConfigComponentStatus.Pass => AuthSsoPreflightCheckStatus.Pass,
                SamlTestConfigComponentStatus.Warn => AuthSsoPreflightCheckStatus.Warn,
                SamlTestConfigComponentStatus.Fail => AuthSsoPreflightCheckStatus.Fail,
                _ => AuthSsoPreflightCheckStatus.Info,
            };

            results.Add(new AuthSsoPreflightCheckResult($"saml.{row.Component}", status, row.Detail));
        }
    }

    private static void AppendScimChecks(IConfiguration configuration, List<AuthSsoPreflightCheckResult> results)
    {
        bool scimSectionPresent = configuration.GetSection("Scim").Exists()
            || configuration.GetSection("ArchLucid:Scim").Exists();

        results.Add(new AuthSsoPreflightCheckResult(
            "scim.configurationSection",
            scimSectionPresent ? AuthSsoPreflightCheckStatus.Pass : AuthSsoPreflightCheckStatus.Info,
            scimSectionPresent
                ? "SCIM configuration section present in merged appsettings."
                : "No SCIM section in offline config — provision tokens via admin API (see docs/integrations/SCIM_PROVISIONING.md)."));

        results.Add(new AuthSsoPreflightCheckResult(
            "scim.activeToken",
            AuthSsoPreflightCheckStatus.Info,
            "Active SCIM bearer token presence requires SQL/API — run `archlucid auth diagnostics` when the API is reachable."));
    }

    private static void AppendKeyVaultReferenceChecks(IConfiguration configuration, List<AuthSsoPreflightCheckResult> results)
    {
        int keyVaultRefs = 0;

        foreach (KeyValuePair<string, string?> pair in configuration.AsEnumerable())
        {
            if (string.IsNullOrWhiteSpace(pair.Value))
                continue;

            if (pair.Value.Contains("@Microsoft.KeyVault", StringComparison.OrdinalIgnoreCase))
                keyVaultRefs++;
        }

        results.Add(new AuthSsoPreflightCheckResult(
            "secrets.keyVaultReferences",
            keyVaultRefs > 0 ? AuthSsoPreflightCheckStatus.Pass : AuthSsoPreflightCheckStatus.Info,
            keyVaultRefs > 0
                ? $"{keyVaultRefs} Key Vault reference(s) detected (values redacted)."
                : "No Key Vault secret references detected in merged configuration."));
    }

    private static AuthSsoPreflightCheckResult PresenceCheck(string component, string? value, string configKey) =>
        new(
            component,
            string.IsNullOrWhiteSpace(value) ? AuthSsoPreflightCheckStatus.Warn : AuthSsoPreflightCheckStatus.Pass,
            string.IsNullOrWhiteSpace(value)
                ? $"{configKey} is not configured."
                : $"{configKey} is configured (value redacted).");
}
