using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.Hosting;

/// <summary>
///     Production-profile dangerous misconfiguration checks shared by API/worker startup validation and the
///     <c>archlucid config lint</c> CLI command.
/// </summary>
public static class ProductionDangerousMisconfigurationLint
{
    /// <summary>
    ///     True when ASP.NET Core is Production, <c>ARCHLUCID_ENVIRONMENT=Production</c>, or
    ///     <c>ProductionValidation:Strict=true</c> with Staging (ASP.NET or ArchLucid environment name).
    /// </summary>
    public static bool AppliesDangerousFailFast(string aspNetCoreEnvironmentName, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (string.IsNullOrWhiteSpace(aspNetCoreEnvironmentName))
            throw new ArgumentException("ASP.NET Core environment name is required.", nameof(aspNetCoreEnvironmentName));

        string trimmedAsp = aspNetCoreEnvironmentName.Trim();
        string? arch = ReadArchLucidEnvironment(configuration)?.Trim();

        bool aspNetProd = string.Equals(trimmedAsp, Environments.Production, StringComparison.OrdinalIgnoreCase);
        bool aspNetStaging = string.Equals(trimmedAsp, Environments.Staging, StringComparison.OrdinalIgnoreCase);
        bool archProd = string.Equals(arch, "Production", StringComparison.OrdinalIgnoreCase);
        bool archStaging = string.Equals(arch, "Staging", StringComparison.OrdinalIgnoreCase);

        bool strict = configuration.GetValue("ProductionValidation:Strict", false);

        if (aspNetProd || archProd)
            return true;

        if (strict && (aspNetStaging || archStaging))
            return true;

        return false;
    }

    /// <summary>Returns stable <see cref="HostingMisconfigurationWarning.RuleName" /> values and operator text.</summary>
    public static IReadOnlyList<HostingMisconfigurationWarning> DescribeFailFastFindings(
        IConfiguration configuration,
        string aspNetCoreEnvironmentName)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (!AppliesDangerousFailFast(aspNetCoreEnvironmentName, configuration))
            return [];

        string trimmedAsp = aspNetCoreEnvironmentName.Trim();
        string? arch = ReadArchLucidEnvironment(configuration)?.Trim();

        bool productionNamedProfile =
            string.Equals(trimmedAsp, Environments.Production, StringComparison.OrdinalIgnoreCase)
            || string.Equals(arch, "Production", StringComparison.OrdinalIgnoreCase);

        List<HostingMisconfigurationWarning> findings = [];

        if (configuration.GetValue("Authentication:ApiKey:DevelopmentBypassAll", false))
        {
            findings.Add(
                new HostingMisconfigurationWarning(
                    ProductionLikeHostingMisconfigurationAdvisorRuleNames.AuthenticationApiKeyDevelopmentBypassAllDisallowed,
                    "Authentication:ApiKey:DevelopmentBypassAll must be false under production-profile validation "
                    + "(ASP.NET Core Production, ARCHLUCID_ENVIRONMENT=Production, or ProductionValidation:Strict with Staging)."));
        }

        string? mode = configuration[$"{ArchLucidAuthSection}:Mode"]?.Trim();

        if (!IsWellKnownAuthMode(mode))
        {
            findings.Add(
                new HostingMisconfigurationWarning(
                    ProductionLikeHostingMisconfigurationAdvisorRuleNames.AuthModeUnrecognized,
                    "ArchLucidAuth:Mode must be ApiKey, JwtBearer, or DevelopmentBypass. "
                    + "Unrecognized values are not allowed (they are treated as an unsupported auth path at startup)."));
        }
        else if (string.Equals(mode, "DevelopmentBypass", StringComparison.OrdinalIgnoreCase))
        {
            findings.Add(
                new HostingMisconfigurationWarning(
                    ProductionLikeHostingMisconfigurationAdvisorRuleNames.AuthModeDevelopmentBypassDisallowed,
                    "ArchLucidAuth:Mode cannot be DevelopmentBypass under production-profile validation."));
        }
        else if (string.Equals(mode, "JwtBearer", StringComparison.OrdinalIgnoreCase))
        {
            string? pemPath = configuration[$"{ArchLucidAuthSection}:JwtSigningPublicKeyPemPath"]?.Trim();
            string? authority = configuration[$"{ArchLucidAuthSection}:Authority"]?.Trim();

            if (productionNamedProfile && !string.IsNullOrWhiteSpace(pemPath))
            {
                findings.Add(
                    new HostingMisconfigurationWarning(
                        ProductionLikeHostingMisconfigurationAdvisorRuleNames.JwtBearerLocalPemDisallowedProductionProfile,
                        "ArchLucidAuth:JwtSigningPublicKeyPemPath is set; local JWT validation is for non-production / CI only "
                        + "and must not be used when the host is ASP.NET Core Production or ARCHLUCID_ENVIRONMENT=Production."));
            }
            else if (string.IsNullOrWhiteSpace(pemPath) && string.IsNullOrWhiteSpace(authority))
            {
                findings.Add(
                    new HostingMisconfigurationWarning(
                        ProductionLikeHostingMisconfigurationAdvisorRuleNames.JwtBearerMissingAuthorityAndPem,
                        "ArchLucidAuth:Mode is JwtBearer but neither ArchLucidAuth:Authority nor "
                        + "ArchLucidAuth:JwtSigningPublicKeyPemPath is set; JWT authentication cannot succeed."));
            }
        }
        else if (string.Equals(mode, "ApiKey", StringComparison.OrdinalIgnoreCase)
                 && !configuration.GetValue("Authentication:ApiKey:Enabled", false))
        {
            findings.Add(
                new HostingMisconfigurationWarning(
                    ProductionLikeHostingMisconfigurationAdvisorRuleNames.ApiKeyModeDisabledWhenConfigured,
                    "ArchLucidAuth:Mode is ApiKey but Authentication:ApiKey:Enabled is false; "
                    + "configure API keys or switch ArchLucidAuth:Mode."));
        }

        if (configuration.GetValue("ArchLucid:Persistence:AllowRlsBypass", false))
        {
            findings.Add(
                new HostingMisconfigurationWarning(
                    ProductionLikeHostingMisconfigurationAdvisorRuleNames.PersistenceAllowRlsBypassDisallowed,
                    "ArchLucid:Persistence:AllowRlsBypass must be false under production-profile validation "
                    + "(SQL RLS break-glass belongs only in controlled break-glass operations)."));
        }

        string? agentMode = configuration["AgentExecution:Mode"]?.Trim();
        bool realMode = string.Equals(agentMode, "Real", StringComparison.OrdinalIgnoreCase);

        if (realMode)
        {
            string? completionClient = configuration["AgentExecution:CompletionClient"]?.Trim();
            bool echo = string.Equals(completionClient, "Echo", StringComparison.OrdinalIgnoreCase);

            if (!echo)
            {
                LlmPromptRedactionOptions redaction =
                    configuration.GetSection(LlmPromptRedactionOptions.SectionName).Get<LlmPromptRedactionOptions>()
                    ?? new LlmPromptRedactionOptions();

                if (!redaction.Enabled)
                {
                    findings.Add(
                        new HostingMisconfigurationWarning(
                            ProductionLikeHostingMisconfigurationAdvisorRuleNames.LlmPromptRedactionRequiredForRealMode,
                            "LlmPromptRedaction:Enabled must be true when AgentExecution:Mode is Real under production-profile validation "
                            + "(deny-list redaction before outbound LLM calls and trace persistence)."));
                }
            }
        }

        if (configuration.GetValue("ProductionValidation:RequireTelemetryExport", false))
        {
            string? otlpEndpointRaw = configuration["Observability:Otlp:Endpoint"]?.Trim();
            bool otlpEndpointPresent = !string.IsNullOrWhiteSpace(otlpEndpointRaw);
            bool? otlpEnabled = configuration.GetValue<bool?>("Observability:Otlp:Enabled");
            bool otlpActive = otlpEndpointPresent && (!otlpEnabled.HasValue || otlpEnabled.Value);

            string? applicationInsightsConnectionString = configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"]?.Trim();

            if (string.IsNullOrWhiteSpace(applicationInsightsConnectionString))
                applicationInsightsConnectionString = configuration["ApplicationInsights:ConnectionString"]?.Trim();

            if (string.IsNullOrWhiteSpace(applicationInsightsConnectionString))
                applicationInsightsConnectionString =
                    configuration["Observability:AzureMonitor:ApplicationInsightsConnectionString"]?.Trim();

            bool applicationInsightsOk = !string.IsNullOrWhiteSpace(applicationInsightsConnectionString);
            bool prometheusOk = configuration.GetValue("Observability:Prometheus:Enabled", false);

            if (!otlpActive && !applicationInsightsOk && !prometheusOk)
            {
                findings.Add(
                    new HostingMisconfigurationWarning(
                        ProductionLikeHostingMisconfigurationAdvisorRuleNames.TelemetryExportRequiredMissing,
                        "ProductionValidation:RequireTelemetryExport is true but no telemetry sink is configured. "
                        + "Set Observability:Otlp:Endpoint (with Observability:Otlp:Enabled=true or omit), "
                        + "an Application Insights connection string "
                        + "(APPLICATIONINSIGHTS_CONNECTION_STRING, ApplicationInsights:ConnectionString, or "
                        + "Observability:AzureMonitor:ApplicationInsightsConnectionString), "
                        + "or Observability:Prometheus:Enabled=true."));
            }
        }

        return findings;
    }

    private static string? ReadArchLucidEnvironment(IConfiguration configuration)
    {
        string? archLucidEnv = configuration["ARCHLUCID_ENVIRONMENT"];

        if (string.IsNullOrWhiteSpace(archLucidEnv))
            archLucidEnv = Environment.GetEnvironmentVariable("ARCHLUCID_ENVIRONMENT");

        return archLucidEnv;
    }

    private static bool IsWellKnownAuthMode(string? mode)
    {
        if (string.IsNullOrWhiteSpace(mode))
            return true;

        if (string.Equals(mode, "JwtBearer", StringComparison.OrdinalIgnoreCase))
            return true;

        return string.Equals(mode, "ApiKey", StringComparison.OrdinalIgnoreCase)
               || string.Equals(mode, "DevelopmentBypass", StringComparison.OrdinalIgnoreCase);
    }

    private const string ArchLucidAuthSection = "ArchLucidAuth";
}
