using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Host.Core.Startup.Diagnostics;
using ArchLucid.Host.Core.Startup.Validation;

namespace ArchLucid.Worker;

/// <summary>Background worker host: advisory scans, data archival, retrieval indexing outbox (no public HTTP API). Deferred authority outbox work logs agent execution state transitions in <see cref="ArchLucid.Host.Core.Hosted.AuthorityPipelineWorkProcessor"/>.</summary>
// ReSharper disable once PartialTypeWithSinglePart
public partial class Program
{
    public static async Task Main(string[] args)
    {
        WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

        // Configuration layering matches ArchLucid.Api/Program.cs so the shared /app image honors Pilot/Advanced/SaaS overlays when ENTRYPOINT runs ArchLucid.Worker.dll.
        if (!builder.Environment.IsDevelopment())
        {
            builder.Configuration.AddJsonFile(
                Path.Combine(builder.Environment.ContentRootPath, "appsettings.Pilot.json"),
                optional: true,
                reloadOnChange: true);
        }

        builder.Configuration.AddJsonFile(
            Path.Combine(builder.Environment.ContentRootPath, "appsettings.Advanced.json"),
            optional: true,
            reloadOnChange: true);

        builder.Configuration.AddJsonFile(
            Path.Combine(builder.Environment.ContentRootPath, "appsettings.SaaS.json"),
            optional: true,
            reloadOnChange: true);

        builder.Configuration.AddEnvironmentVariables();

        WorkerProcessHostingRoleConfiguration.Apply(builder);

        AzureOpenAiEnvironmentConfigurationBridge.Apply(builder.Configuration);

        // DAST / defense in depth: omit Kestrel "Server" version token (ZAP 10036); TLS identity lives at the ingress.
        builder.WebHost.ConfigureKestrel(static options => options.AddServerHeader = false);

        builder.AddArchLucidGracefulShutdown();

        ArchLucidSerilogConfiguration.Configure(builder, "ArchLucid.Worker");

        builder.Services.AddHttpContextAccessor();
        // Singleton: matches Api registration; LLM completion cache (singleton) resolves partition scope per call.
        builder.Services.AddSingleton<IScopeContextProvider, HttpScopeContextProvider>();
        builder.Services.AddArchLucidOpenTelemetry(
            builder.Configuration,
            builder.Environment,
            telemetryServiceName: "ArchLucid.Worker");
        builder.Services.AddArchLucidApplicationServices(builder.Configuration, ArchLucidHostingRole.Worker);

        WorkerProcessHostingRoleConfiguration.ValidateOrThrow(builder);

        WebApplication app = builder.Build();

        ArchLucidLegacyConfigurationWarnings.LogIfLegacyKeysPresent(app.Configuration, app.Logger);
        ContentSafetyConfigurationWarnings.LogIfProductionLikeFailOpenSdkSettingIsIgnored(
            app.Configuration,
            app.Environment,
            app.Logger);

        ArchLucidConfigurationRules.LogConfigurationWarnings(app.Configuration, app.Environment, app.Logger);

        StartupConfigurationDiagnostics.LogIfEnabled(
            app.Logger,
            app.Configuration,
            app.Environment,
            typeof(Program).Assembly);

        await ArchLucidPersistenceStartup.RunSchemaBootstrapMigrationsAndOptionalDemoSeedAsync(app);

        app.Logger.LogInformation("ArchLucid Worker starting (hosted background services only).");
        app.UseArchLucidWorkerPipeline();
        await app.RunAsync();
    }
}
