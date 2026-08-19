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
    /// <summary>Keys consulted by <see cref="DescribeFailFastFindings" />; kept aligned with <see cref="ConfigurationKeyCatalog" /> guard metadata.</summary>
    public static IReadOnlySet<string> MonitoredConfigurationKeys =>
        ProductionProfileFailFastMonitoredConfigurationPaths.KeysConsultedByDescribeFailFastFindings;

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

        return strict && (aspNetStaging || archStaging);
    }

    /// <summary>
    ///     Returns stable <see cref="HostingMisconfigurationWarning.RuleName" /> values and operator text. When
    ///     <see cref="AppliesDangerousFailFast" /> is false but ASP.NET Core is not Development, still evaluates catalog
    ///     DeveloperBypass keys (<c>Authentication:ApiKey:DevelopmentBypassAll</c>, <c>ArchLucidAuth:Mode=DevelopmentBypass</c>).
    /// </summary>
    public static IReadOnlyList<HostingMisconfigurationWarning> DescribeFailFastFindings(
        IConfiguration configuration,
        string aspNetCoreEnvironmentName)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        string trimmedAsp = aspNetCoreEnvironmentName.Trim();
        string? arch = ReadArchLucidEnvironment(configuration)?.Trim();

        bool fullFailFast = AppliesDangerousFailFast(aspNetCoreEnvironmentName, configuration);
        bool nonDevelopmentDeveloperBypassSurface =
            !fullFailFast
            && !string.Equals(trimmedAsp, Environments.Development, StringComparison.OrdinalIgnoreCase);

        if (!fullFailFast && !nonDevelopmentDeveloperBypassSurface)
            return [];

        bool productionNamedProfile =
            string.Equals(trimmedAsp, Environments.Production, StringComparison.OrdinalIgnoreCase)
            || string.Equals(arch, "Production", StringComparison.OrdinalIgnoreCase);

        List<HostingMisconfigurationWarning> findings = [];

        if (configuration.GetValue(ProductionProfileFailFastMonitoredConfigurationPaths.AuthenticationApiKeyDevelopmentBypassAll, false))
        {
            findings.Add(
                new HostingMisconfigurationWarning(
                    ProductionLikeHostingMisconfigurationAdvisorRuleNames.AuthenticationApiKeyDevelopmentBypassAllDisallowed,
                    "Authentication:ApiKey:DevelopmentBypassAll must be false under production-profile validation "
                    + "(ASP.NET Core Production, ARCHLUCID_ENVIRONMENT=Production, ProductionValidation:Strict with Staging, "
                    + "or ASP.NET Core / ARCHLUCID_ENVIRONMENT Staging for this developer-bypass flag)."));
        }

        string? mode = configuration[ProductionProfileFailFastMonitoredConfigurationPaths.ArchLucidAuthMode]?.Trim();

        if (fullFailFast)
        {
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
                        "ArchLucidAuth:Mode cannot be DevelopmentBypass under production-profile validation "
                        + "(ASP.NET Core Production via ASPNETCORE_ENVIRONMENT/DOTNET_ENVIRONMENT, ARCHLUCID_ENVIRONMENT=Production, "
                        + "or ProductionValidation:Strict with Staging)."));
            }
            else if (string.Equals(mode, "JwtBearer", StringComparison.OrdinalIgnoreCase))
            {
                string? pemPath =
                    configuration[ProductionProfileFailFastMonitoredConfigurationPaths.ArchLucidAuthJwtSigningPublicKeyPemPath]
                        ?.Trim();
                string? authority =
                    configuration[ProductionProfileFailFastMonitoredConfigurationPaths.ArchLucidAuthAuthority]?.Trim();

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
                     && !configuration.GetValue(ProductionProfileFailFastMonitoredConfigurationPaths.AuthenticationApiKeyEnabled, false))
            {
                findings.Add(
                    new HostingMisconfigurationWarning(
                        ProductionLikeHostingMisconfigurationAdvisorRuleNames.ApiKeyModeDisabledWhenConfigured,
                        "ArchLucidAuth:Mode is ApiKey but Authentication:ApiKey:Enabled is false; "
                        + "configure API keys or switch ArchLucidAuth:Mode."));
            }

            string? agentMode =
                configuration[ProductionProfileFailFastMonitoredConfigurationPaths.AgentExecutionMode]?.Trim();
            bool realMode = string.Equals(agentMode, "Real", StringComparison.OrdinalIgnoreCase);

            if (realMode)
            {
                string? completionClient =
                    configuration[ProductionProfileFailFastMonitoredConfigurationPaths.AgentExecutionCompletionClient]?.Trim();
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

            if (!configuration.GetValue(
                    ProductionProfileFailFastMonitoredConfigurationPaths.ProductionValidationRequireTelemetryExport, false))
                return findings;

            string? otlpEndpointRaw =
                configuration[ProductionProfileFailFastMonitoredConfigurationPaths.ObservabilityOtlpEndpoint]?.Trim();
            bool otlpEndpointPresent = !string.IsNullOrWhiteSpace(otlpEndpointRaw);
            bool? otlpEnabled =
                configuration.GetValue<bool?>(ProductionProfileFailFastMonitoredConfigurationPaths.ObservabilityOtlpEnabled);
            bool otlpActive = otlpEndpointPresent && (!otlpEnabled.HasValue || otlpEnabled.Value);

            string? applicationInsightsConnectionString =
                configuration[ProductionProfileFailFastMonitoredConfigurationPaths.ApplicationInsightsConnectionStringEnv]?.Trim();

            if (string.IsNullOrWhiteSpace(applicationInsightsConnectionString))
                applicationInsightsConnectionString =
                    configuration[ProductionProfileFailFastMonitoredConfigurationPaths.ApplicationInsightsConnectionString]?.Trim();

            if (string.IsNullOrWhiteSpace(applicationInsightsConnectionString))
                applicationInsightsConnectionString =
                    configuration[
                            ProductionProfileFailFastMonitoredConfigurationPaths
                                .ObservabilityAzureMonitorApplicationInsightsConnectionString]
                        ?.Trim();

            bool applicationInsightsOk = !string.IsNullOrWhiteSpace(applicationInsightsConnectionString);
            bool prometheusOk =
                configuration.GetValue(ProductionProfileFailFastMonitoredConfigurationPaths.ObservabilityPrometheusEnabled, false);

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

            return findings;
        }

        if (string.Equals(mode, "DevelopmentBypass", StringComparison.OrdinalIgnoreCase))
        {
            findings.Add(
                new HostingMisconfigurationWarning(
                    ProductionLikeHostingMisconfigurationAdvisorRuleNames.AuthModeDevelopmentBypassDisallowed,
                    "ArchLucidAuth:Mode cannot be DevelopmentBypass when ASP.NET Core is not Development "
                    + "(set ArchLucidAuth:Mode to ApiKey or JwtBearer for this environment)."));
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
}
