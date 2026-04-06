using System.Reflection;

namespace ArchLucid.Host.Core.Startup.Diagnostics;

/// <summary>
/// Emits a single structured log line with non-secret configuration facts when enabled.
/// </summary>
public static class StartupConfigurationDiagnostics
{
    public static void LogIfEnabled(
        ILogger logger,
        IConfiguration configuration,
        IHostEnvironment environment,
        Assembly hostAssembly)
    {
        if (!configuration.GetValue("Hosting:LogStartupConfigurationSummary", true))
        
            return;
        

        StartupConfigurationFacts facts = StartupConfigurationFactsReader.FromConfiguration(
            configuration,
            environment,
            hostAssembly);

        logger.LogInformation(
            "Pilot/support configuration snapshot: BuildInformationalVersion={BuildInformationalVersion}, BuildAssemblyVersion={BuildAssemblyVersion}, BuildFileVersion={BuildFileVersion}, BuildCommitSha={BuildCommitSha}, RuntimeFramework={RuntimeFramework}, Environment={Environment}, ContentRoot={ContentRoot}, SqlConnectionConfigured={SqlConnectionConfigured}, ArchLucidStorageProvider={StorageProvider}, RetrievalVectorIndex={RetrievalVectorIndex}, AgentExecutionMode={AgentMode}, ArchLucidAuthMode={AuthMode}, ApiKeyAuthEnabled={ApiKeyEnabled}, ApiKeyAdminConfigured={ApiKeyAdminConfigured}, ApiKeyReadOnlyConfigured={ApiKeyReadOnlyConfigured}, CorsOriginCount={CorsCount}, RateLimitPermitLimitWindow={RateLimit}, PrometheusEnabled={Prometheus}, DemoEnabled={DemoEnabled}, DemoSeedOnStartup={DemoSeed}, SchemaValidationDetailedErrors={SchemaDetailed}",
            facts.BuildInformationalVersion,
            facts.BuildAssemblyVersion,
            facts.BuildFileVersion ?? "(none)",
            facts.BuildCommitSha ?? "(not stamped)",
            facts.RuntimeFrameworkDescription,
            facts.HostEnvironmentName,
            facts.ContentRootPath,
            facts.SqlConnectionStringConfigured,
            facts.ArchLucidStorageProvider,
            facts.RetrievalVectorIndex,
            facts.AgentExecutionMode,
            facts.ArchLucidAuthMode,
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
