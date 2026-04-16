using System.Reflection;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Cosmos;

namespace ArchLucid.Host.Core.Startup.Diagnostics;

/// <summary>
/// Non-secret effective configuration surfaced once at startup for pilot support and diagnostics.
/// </summary>
/// <param name="BuildCommitSha">Parsed commit from informational version when SourceRevisionId was set at build; otherwise null.</param>
public sealed record StartupConfigurationFacts(
    string HostEnvironmentName,
    string ContentRootPath,
    bool SqlConnectionStringConfigured,
    string ArchLucidStorageProvider,
    string RetrievalVectorIndex,
    string AgentExecutionMode,
    string ArchLucidAuthMode,
    bool AuthenticationApiKeyEnabled,
    bool AuthenticationApiKeyAdminConfigured,
    bool AuthenticationApiKeyReadOnlyConfigured,
    int CorsAllowedOriginCount,
    int RateLimitingFixedWindowPermitLimit,
    bool ObservabilityPrometheusEnabled,
    bool DemoEnabled,
    bool DemoSeedOnStartup,
    bool SchemaValidationEnableDetailedErrors,
    bool CosmosDbPolyglotAnyFeatureEnabled,
    string CosmosDbConnectivitySummary,
    string BuildInformationalVersion,
    string BuildAssemblyVersion,
    string? BuildFileVersion,
    string? BuildCommitSha,
    string RuntimeFrameworkDescription);

internal static class StartupConfigurationFactsReader
{
    public static StartupConfigurationFacts FromConfiguration(
        IConfiguration configuration,
        IHostEnvironment environment,
        Assembly hostAssembly)
    {
        ArgumentNullException.ThrowIfNull(hostAssembly);

        IConfigurationSection corsOrigins = configuration.GetSection("Cors:AllowedOrigins");
        int corsCount = corsOrigins.GetChildren().Count();

        int rateLimit = configuration.GetValue("RateLimiting:FixedWindow:PermitLimit", 0);

        BuildProvenance build = BuildProvenance.FromAssembly(hostAssembly);

        CosmosDbOptions cosmosDb =
            configuration.GetSection(CosmosDbOptions.SectionName).Get<CosmosDbOptions>() ?? new CosmosDbOptions();

        string cosmosSummary = SummarizeCosmosConnectivity(cosmosDb);

        return new StartupConfigurationFacts(
            environment.EnvironmentName,
            environment.ContentRootPath,
            !string.IsNullOrWhiteSpace(ArchLucidConfigurationBridge.ResolveSqlConnectionString(configuration)),
            configuration["ArchLucid:StorageProvider"] ?? "(missing)",
            configuration["Retrieval:VectorIndex"] ?? "(missing)",
            configuration["AgentExecution:Mode"] ?? "(missing)",
            ArchLucidConfigurationBridge.ResolveAuthConfigurationValue(configuration, "Mode") ?? "(missing)",
            configuration.GetValue("Authentication:ApiKey:Enabled", false),
            !string.IsNullOrWhiteSpace(configuration["Authentication:ApiKey:AdminKey"]),
            !string.IsNullOrWhiteSpace(configuration["Authentication:ApiKey:ReadOnlyKey"]),
            corsCount,
            rateLimit,
            configuration.GetValue("Observability:Prometheus:Enabled", false),
            configuration.GetValue("Demo:Enabled", false),
            configuration.GetValue("Demo:SeedOnStartup", false),
            configuration.GetValue("SchemaValidation:EnableDetailedErrors", false),
            cosmosDb.AnyCosmosFeatureEnabled,
            cosmosSummary,
            build.InformationalVersion,
            build.AssemblyVersion,
            build.FileVersion,
            build.CommitSha,
            build.RuntimeFrameworkDescription);
    }

    private static string SummarizeCosmosConnectivity(CosmosDbOptions cosmosDb)
    {
        if (!cosmosDb.AnyCosmosFeatureEnabled)
            return "disabled";

        if (string.IsNullOrWhiteSpace(cosmosDb.ConnectionString))
            return "missing";

        string conn = cosmosDb.ConnectionString.Trim();

        if (conn.Contains("localhost:8081", StringComparison.OrdinalIgnoreCase)
            || conn.Contains("127.0.0.1:8081", StringComparison.OrdinalIgnoreCase))
            return "emulator";

        return "configured";
    }
}
