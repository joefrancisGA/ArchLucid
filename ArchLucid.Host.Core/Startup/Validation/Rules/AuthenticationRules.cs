using ArchLucid.Core.Auth.Saml;
using ArchLucid.Core.Hosting;

using ArchLucid.Host.Core.Configuration;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class AuthenticationRules
{
    public static void CollectApiKeyWhenEnabled(IConfiguration configuration, List<string> errors)
    {
        bool apiKeyEnabled = configuration.GetValue("Authentication:ApiKey:Enabled", false);

        if (!apiKeyEnabled)
            return;

        string? adminKey = configuration["Authentication:ApiKey:AdminKey"];
        string? readerKey = configuration["Authentication:ApiKey:ReadOnlyKey"];

        if (string.IsNullOrWhiteSpace(adminKey) && string.IsNullOrWhiteSpace(readerKey))
            errors.Add(
                "When Authentication:ApiKey:Enabled is true, at least one of Authentication:ApiKey:AdminKey or Authentication:ApiKey:ReadOnlyKey must be configured.");
    }

    /// <summary>
    /// When API keys are enabled in Production, rejects placeholder-like or overly short configured keys.
    /// Applies to API and Worker hosts (runs before Worker-only early return).
    /// </summary>
    public static void CollectProductionApiKeyPlaceholders(IConfiguration configuration, List<string> errors)
    {
        if (!configuration.GetValue("Authentication:ApiKey:Enabled", false))
            return;

        string? adminKey = configuration["Authentication:ApiKey:AdminKey"];

        if (!string.IsNullOrWhiteSpace(adminKey) && ApiKeyPlaceholderDetection.IsPlaceholderValue(adminKey))
            errors.Add(
                "Authentication:ApiKey:AdminKey appears to be a placeholder or weak value. Use a cryptographically random key of at least 20 characters in Production.");

        string? readOnlyKey = configuration["Authentication:ApiKey:ReadOnlyKey"];

        if (!string.IsNullOrWhiteSpace(readOnlyKey) && ApiKeyPlaceholderDetection.IsPlaceholderValue(readOnlyKey))

            errors.Add(
                "Authentication:ApiKey:ReadOnlyKey appears to be a placeholder or weak value. Use a cryptographically random key of at least 20 characters in Production.");
    }

    /// <summary>
    /// When <c>ArchLucidAuth:JwtSigningPublicKeyPemPath</c> is set (local RSA public key), require issuer and audience.
    /// Applies in all environments so misconfigured CI or dev hosts fail fast.
    /// </summary>
    public static void CollectJwtBearerLocalSigningKey(IConfiguration configuration, List<string> errors)
    {
        string? authMode = ArchLucidConfigurationBridge.ResolveAuthConfigurationValue(configuration, "Mode");

        if (!string.Equals(authMode, "JwtBearer", StringComparison.OrdinalIgnoreCase))
            return;

        string? pemPath =
            ArchLucidConfigurationBridge.ResolveAuthConfigurationValue(configuration, "JwtSigningPublicKeyPemPath");

        if (string.IsNullOrWhiteSpace(pemPath))
            return;

        if (string.IsNullOrWhiteSpace(
                ArchLucidConfigurationBridge.ResolveAuthConfigurationValue(configuration, "JwtLocalIssuer")))
            errors.Add(
                "ArchLucidAuth:JwtLocalIssuer is required when ArchLucidAuth:JwtSigningPublicKeyPemPath is set.");

        if (string.IsNullOrWhiteSpace(
                ArchLucidConfigurationBridge.ResolveAuthConfigurationValue(configuration, "JwtLocalAudience")))
            errors.Add(
                "ArchLucidAuth:JwtLocalAudience is required when ArchLucidAuth:JwtSigningPublicKeyPemPath is set.");
    }

    /// <summary>
    ///     Rejects <c>Authentication:ApiKey:DevelopmentBypassAll=true</c> on Production hosts (fail-fast startup).
    /// </summary>
    public static void CollectProductionApiKeyDevelopmentBypassDisallowed(IConfiguration configuration, List<string> errors)
    {
        if (!configuration.GetValue("Authentication:ApiKey:DevelopmentBypassAll", false))
            return;

        errors.Add(
            "Authentication:ApiKey:DevelopmentBypassAll must be false in Production. "
            + "The API refuses to start when the development bypass flag is enabled.");
    }

    /// <summary>
    ///     Production ASP.NET Core-only API key checks. Dangerous auth combinations are validated for a broader
    ///     production profile via <see cref="ProductionDangerousMisconfigurationLint" /> (includes ARCHLUCID_ENVIRONMENT
    ///     and strict staging).
    /// </summary>
    public static void CollectProductionAuthModes(IConfiguration configuration, List<string> errors)
    {
        string? authMode = ArchLucidConfigurationBridge.ResolveAuthConfigurationValue(configuration, "Mode");

        if (configuration.GetValue("ArchLucidAuth:RequireJwtBearerInProduction", false) &&
            !string.Equals(authMode, "JwtBearer", StringComparison.OrdinalIgnoreCase))
            errors.Add(
                "ArchLucidAuth:RequireJwtBearerInProduction is true: Production must use ArchLucidAuth:Mode=JwtBearer (Entra or OIDC Authority).");

        if (!string.Equals(authMode, "ApiKey", StringComparison.OrdinalIgnoreCase))
            return;

        string? productionApiAdminKey = configuration["Authentication:ApiKey:AdminKey"];
        string? productionApiReaderKey = configuration["Authentication:ApiKey:ReadOnlyKey"];

        if (string.IsNullOrWhiteSpace(productionApiAdminKey) && string.IsNullOrWhiteSpace(productionApiReaderKey))

            errors.Add(
                "Production ApiKey auth requires at least one of Authentication:ApiKey:AdminKey or Authentication:ApiKey:ReadOnlyKey.");
    }

    /// <summary>
    ///     When SAML SP is enabled, require issuer, IdP metadata URL, and a readable signing certificate path.
    /// </summary>
    public static void CollectSamlSpWhenEnabled(IConfiguration configuration, List<string> errors)
    {
        SamlSpConfigurationSnapshot snapshot = configuration
                .GetSection(SamlSpConfigurationSnapshot.ConfigurationSectionPath)
                .Get<SamlSpConfigurationSnapshot>()
            ?? new SamlSpConfigurationSnapshot();

        if (!snapshot.Enabled)
            return;

        if (string.IsNullOrWhiteSpace(snapshot.Issuer))
            errors.Add("ArchLucidAuth:Saml2:Issuer is required when ArchLucidAuth:Saml2:Enabled is true.");

        if (string.IsNullOrWhiteSpace(snapshot.IdPMetadata))
            errors.Add("ArchLucidAuth:Saml2:IdPMetadata is required when ArchLucidAuth:Saml2:Enabled is true.");

        if (string.IsNullOrWhiteSpace(snapshot.SigningCertificateFile))
        {
            errors.Add("ArchLucidAuth:Saml2:SigningCertificateFile is required when ArchLucidAuth:Saml2:Enabled is true.");

            return;
        }

        string certPath = snapshot.SigningCertificateFile.Trim();

        if (!Path.IsPathRooted(certPath))
            certPath = Path.Combine(AppContext.BaseDirectory, certPath);

        if (!File.Exists(certPath))
            errors.Add($"ArchLucidAuth:Saml2:SigningCertificateFile does not exist or is not readable: '{certPath}'.");
    }
}
