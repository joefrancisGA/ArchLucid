using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class ProductionSafetyRules
{
    /// <summary>
    /// Ephemeral in-memory persistence must not run under Production-like hosts (matches Content Safety / RLS guardrails).
    /// Narrow exception: ASP.NET <see cref="Environments.Development" /> with <c>ARCHLUCID_ENVIRONMENT=Staging</c> only
    /// so integration tests can bind staging-like signals (e.g. JWT advisor checks) without SQL; not a deployed tier.
    /// </summary>
    public static void CollectEphemeralStorageDisallowedInProductionLike(
        IConfiguration configuration,
        IHostEnvironment environment,
        ArchLucidOptions archLucidOptions,
        List<string> errors)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);
        ArgumentNullException.ThrowIfNull(archLucidOptions);
        ArgumentNullException.ThrowIfNull(errors);

        if (!HostEnvironmentClassification.IsProductionOrStagingLike(environment, configuration))
            return;

        if (!ArchLucidOptions.EffectiveIsInMemory(archLucidOptions.StorageProvider))
            return;

        if (AllowsInMemoryForDevelopmentArchLucidStagingOnly(environment, configuration))
            return;

        errors.Add(
            "Production-like hosts (ASP.NET Environment Production or Staging, or ARCHLUCID_ENVIRONMENT=Production|Staging) "
            + "must not use ArchLucid:StorageProvider=InMemory; use Sql with ConnectionStrings:ArchLucid (durable persistence).");
    }

    /// <summary>
    /// <see cref="CollectEphemeralStorageDisallowedInProductionLike" /> carve-out for WebApplicationFactory + advisor tests.
    /// </summary>
    private static bool AllowsInMemoryForDevelopmentArchLucidStagingOnly(
        IHostEnvironment environment,
        IConfiguration configuration)
    {
        if (!environment.IsDevelopment())
            return false;

        string? archLucidEnv = configuration["ARCHLUCID_ENVIRONMENT"];

        if (string.IsNullOrWhiteSpace(archLucidEnv))
            archLucidEnv = Environment.GetEnvironmentVariable("ARCHLUCID_ENVIRONMENT");

        return string.Equals(archLucidEnv?.Trim(), "Staging", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Stripe billing requires a configured secret API key in Production when selected as the provider.</summary>
    public static void CollectBillingStripeSecret(IConfiguration configuration, List<string> errors)
    {
        BillingOptions billing =
            configuration.GetSection(BillingOptions.SectionName).Get<BillingOptions>() ?? new BillingOptions();

        if (!string.Equals(billing.Provider.Trim(), BillingProviderNames.Stripe, StringComparison.OrdinalIgnoreCase))
            return;

        if (!string.IsNullOrWhiteSpace(billing.Stripe.SecretKey?.Trim()))
            return;

        errors.Add(
            "Billing:Provider is Stripe; configure Billing:Stripe:SecretKey (Key Vault secret reference in production).");
    }

    /// <summary>ACS email requires an explicit endpoint URL in Production when selected as the provider.</summary>
    public static void CollectTransactionalEmailAcs(IConfiguration configuration, List<string> errors)
    {
        EmailNotificationOptions email =
            configuration.GetSection(EmailNotificationOptions.SectionName).Get<EmailNotificationOptions>()
            ?? new EmailNotificationOptions();

        if (!string.Equals(email.Provider.Trim(), EmailProviderNames.AzureCommunicationServices, StringComparison.OrdinalIgnoreCase))
            return;

        if (!string.IsNullOrWhiteSpace(email.AzureCommunicationServicesEndpoint?.Trim()))
            return;

        errors.Add(
            "Email:Provider is AzureCommunicationServices; configure Email:AzureCommunicationServicesEndpoint with the ACS Email resource endpoint (HTTPS).");
    }

    /// <summary>
    ///     Azure DevOps PR decoration must not use a raw PAT in Production; App Service / Container Apps Key Vault
    ///     reference syntax only.
    /// </summary>
    public static void CollectAzureDevOpsPersonalAccessTokenKeyVaultReference(IConfiguration configuration, List<string> errors)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(errors);

        const string sectionName = "AzureDevOps";

        IConfigurationSection ado = configuration.GetSection(sectionName);

        if (!ado.GetValue<bool>("Enabled"))
            return;

        string pat = ado["PersonalAccessToken"]?.Trim() ?? string.Empty;

        if (string.IsNullOrEmpty(pat))
            return;

        if (pat.StartsWith("@Microsoft.KeyVault", StringComparison.Ordinal))
            return;

        errors.Add(
            "AzureDevOps:PersonalAccessToken must use a Key Vault reference in Production "
            + "(format: @Microsoft.KeyVault(...)). Raw PATs are not permitted in production config.");
    }

    /// <summary>External ID (CIAM) trial mode requires an explicit directory tenant id in Production.</summary>
    public static void CollectTrialAuthExternalId(IConfiguration configuration, List<string> errors)
    {
        TrialAuthOptions trial =
            configuration.GetSection(TrialAuthOptions.SectionPath).Get<TrialAuthOptions>() ?? new TrialAuthOptions();

        if (!TrialAuthModeConstants.HasMode(trial.Modes, TrialAuthModeConstants.MsaExternalId))
            return;

        if (!string.IsNullOrWhiteSpace(trial.ExternalIdTenantId?.Trim()))
            return;

        errors.Add(
            "Auth:Trial:Modes includes \"MsaExternalId\"; configure Auth:Trial:ExternalIdTenantId with the Entra External ID tenant (directory) id.");
    }

    /// <summary>
    ///     <see cref="SqlTopologyMode.SingleCatalog"/> shares one database across all tenants and is only safe for
    ///     local development and test environments. Production and Staging must use
    ///     <see cref="SqlTopologyMode.SystemWithPerTenantCatalogs"/> so each tenant's data is isolated at the
    ///     database boundary.
    /// </summary>
    public static void CollectSingleCatalogDisallowedInProductionLike(
        IConfiguration configuration,
        List<string> errors)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(errors);

        SqlTopologyOptions topology =
            configuration.GetSection(SqlTopologyOptions.SectionPath).Get<SqlTopologyOptions>()
            ?? new SqlTopologyOptions();

        if (topology.Mode != SqlTopologyMode.SingleCatalog)
            return;

        errors.Add(
            $"ArchLucid:SqlTopology:Mode=SingleCatalog is not permitted in Production or Staging. "
            + $"Set ArchLucid:SqlTopology:Mode=SystemWithPerTenantCatalogs. "
            + $"SingleCatalog shares one SQL database across all tenants and must only be used for local development and test.");
    }

    /// <summary>Fail-fast CORS checks in Production for API-facing hosts only.</summary>
    public static void CollectCors(IConfiguration configuration, List<string> errors)
    {
        string[]? origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();

        if (origins is null || origins.Length == 0)

            errors.Add("Production requires at least one Cors:AllowedOrigins entry.");

        else

            errors.AddRange(
                from origin in origins
                where !string.IsNullOrWhiteSpace(origin)
                select origin.Trim()
                into trimmed
                where string.Equals(trimmed, "*", StringComparison.Ordinal)
                select "Cors:AllowedOrigins must not use a wildcard '*' in Production.");
    }

    /// <summary>Outbound webhook HMAC when HTTP delivery is enabled (API and Worker).</summary>
    public static void CollectWebhookSecrets(IConfiguration configuration, List<string> errors)
    {
        WebhookDeliveryOptions webhook =
            configuration.GetSection(WebhookDeliveryOptions.SectionName).Get<WebhookDeliveryOptions>() ??
            new WebhookDeliveryOptions();

        const int minWebhookSecretChars = 32;

        if (!webhook.UseHttpClient)
            return;

        if (string.IsNullOrWhiteSpace(webhook.HmacSha256SharedSecret))
        {
            errors.Add(
                "WebhookDelivery:HmacSha256SharedSecret is required in Production when WebhookDelivery:UseHttpClient is true.");

            return;
        }

        if (webhook.HmacSha256SharedSecret.Length < minWebhookSecretChars)

            errors.Add(
                $"WebhookDelivery:HmacSha256SharedSecret must be at least {minWebhookSecretChars} characters in Production when WebhookDelivery:UseHttpClient is true.");
    }
}
