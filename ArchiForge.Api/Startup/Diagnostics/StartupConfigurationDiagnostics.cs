using System.Reflection;

namespace ArchiForge.Api.Startup.Diagnostics;

/// <summary>
/// Emits a single structured log line with non-secret configuration facts when enabled.
/// </summary>
internal static class StartupConfigurationDiagnostics
{
    public static void LogIfEnabled(
        ILogger logger,
        IConfiguration configuration,
        IHostEnvironment environment,
        Assembly hostAssembly)
    {
        if (!configuration.GetValue("Hosting:LogStartupConfigurationSummary", true))
        {
            return;
        }

        StartupConfigurationFacts facts = StartupConfigurationFactsReader.FromConfiguration(
            configuration,
            environment,
            hostAssembly);

        logger.LogInformation(
            "Pilot/support configuration snapshot: BuildInformationalVersion={BuildInformationalVersion}, BuildAssemblyVersion={BuildAssemblyVersion}, BuildFileVersion={BuildFileVersion}, RuntimeFramework={RuntimeFramework}, Environment={Environment}, ContentRoot={ContentRoot}, SqlConnectionConfigured={SqlConnectionConfigured}, ArchiForgeStorageProvider={StorageProvider}, RetrievalVectorIndex={RetrievalVectorIndex}, AgentExecutionMode={AgentMode}, ArchiForgeAuthMode={AuthMode}, ApiKeyAuthEnabled={ApiKeyEnabled}, ApiKeyAdminConfigured={ApiKeyAdminConfigured}, ApiKeyReadOnlyConfigured={ApiKeyReadOnlyConfigured}, CorsOriginCount={CorsCount}, RateLimitPermitLimitWindow={RateLimit}, PrometheusEnabled={Prometheus}, DemoEnabled={DemoEnabled}, DemoSeedOnStartup={DemoSeed}, SchemaValidationDetailedErrors={SchemaDetailed}",
            facts.BuildInformationalVersion,
            facts.BuildAssemblyVersion,
            facts.BuildFileVersion ?? "(none)",
            facts.RuntimeFrameworkDescription,
            facts.HostEnvironmentName,
            facts.ContentRootPath,
            facts.SqlConnectionStringConfigured,
            facts.ArchiForgeStorageProvider,
            facts.RetrievalVectorIndex,
            facts.AgentExecutionMode,
            facts.ArchiForgeAuthMode,
            facts.AuthenticationApiKeyEnabled,
            facts.AuthenticationApiKeyAdminConfigured,
            facts.AuthenticationApiKeyReadOnlyConfigured,
            facts.CorsAllowedOriginCount,
            facts.RateLimitingFixedWindowPermitLimit,
            facts.ObservabilityPrometheusEnabled,
            facts.DemoEnabled,
            facts.DemoSeedOnStartup,
            facts.SchemaValidationEnableDetailedErrors);
    }
}
