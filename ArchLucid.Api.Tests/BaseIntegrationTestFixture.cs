using ArchLucid.Core.Configuration;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Base fixture for <see cref="WebApplicationFactory{TEntryPoint}" /> that unifies common setup code
///     such as environment, storage provider, rate limits, and logging.
/// </summary>
public abstract class BaseIntegrationTestFixture : WebApplicationFactory<Program>
{
    private IntegrationTestArtifactBlobEnvironment? _artifactBlobEnvironment;

    /// <summary>
    ///     Process env + host settings for <c>ArtifactLargePayload:BlobProvider</c>. Most Sql integration hosts need
    ///     <c>Local</c>; tests that assert staging-disabled behavior override to <c>None</c>.
    /// </summary>
    protected virtual string ArtifactBlobProviderForIntegrationTests => "Local";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // JWT E2E factories set process env vars that win over in-memory DevelopmentBypass settings in Program.cs.
        JwtIntegrationTestEnvironmentOverrides.Clear();
        _artifactBlobEnvironment?.Dispose();
        _artifactBlobEnvironment = new IntegrationTestArtifactBlobEnvironment(ArtifactBlobProviderForIntegrationTests);

        builder.UseEnvironment("Development");

        builder.UseSetting("DataConsistency:InitialDelaySeconds", "0");
        builder.UseSetting("HostLeaderElection:Enabled", "false");
        // appsettings.Advanced.json defaults BlobProvider=None; bulk evidence writes require a writable store.
        builder.UseSetting("ArtifactLargePayload:BlobProvider", ArtifactBlobProviderForIntegrationTests);
        builder.UseSetting(EvidenceBulkUploadOptions.MaxFilesKey, "200");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            Dictionary<string, string?> settings = new()
            {
                ["DataConsistency:InitialDelaySeconds"] = "0",
                ["HostLeaderElection:Enabled"] = "false",
                ["AgentExecution:Mode"] = "Simulator",
                ["AzureOpenAI:Endpoint"] = "",
                ["AzureOpenAI:ApiKey"] = "",
                ["AzureOpenAI:DeploymentName"] = "",
                ["AzureOpenAI:EmbeddingDeploymentName"] = "",
                ["RateLimiting:FixedWindow:PermitLimit"] = "100000",
                ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
                ["RateLimiting:Expensive:PermitLimit"] = "100000",
                ["RateLimiting:Expensive:WindowMinutes"] = "1",
                ["RateLimiting:Replay:Light:PermitLimit"] = "100000",
                ["RateLimiting:Replay:Heavy:PermitLimit"] = "100000",
                ["RateLimiting:Registration:PermitLimit"] = "100000",
                ["RateLimiting:Registration:WindowMinutes"] = "1",
                ["RateLimiting:EvidenceBulkUpload:PermitLimit"] = "100000",
                ["RateLimiting:EvidenceBulkUpload:WindowMinutes"] = "1",
                ["Billing:Provider"] = "Noop",
                ["ASPNETCORE_URLS"] = "http://127.0.0.1:0",
                ["ArtifactLargePayload:BlobProvider"] = ArtifactBlobProviderForIntegrationTests,
                // Each integration host indexes platform ADR + policy-pack corpora by default; skip in tests (CI memory/time).
                ["Retrieval:PlatformDocs:IndexOnStartup"] = "false",
                ["Retrieval:PolicyPackCorpus:IndexOnStartup"] = "false",
                ["Retrieval:ExemplarCorpus:IndexOnStartup"] = "false",
                [EvidenceBulkUploadOptions.MaxFilesKey] = "200",
                ["Demo:Enabled"] = "false",
                ["Demo:SeedOnStartup"] = "false",
                // Registration integration tests assert POST /v1/register; InviteOnly returns 404.
                ["Auth:PublicSignup:Mode"] = "PublicSelfService",
                // Integration hosts boot many times per shard; disable OTLP/console export and API purge loops that can
                // block WebApplicationFactory teardown on overloaded CI SQL (75 min blame-hang inactivity).
                ["Observability:ConsoleExporter:Enabled"] = "false",
                ["Observability:Otlp:Enabled"] = "false",
                [ArchitectureProjectRetentionPurgeOptions.SectionName + ":Enabled"] = "false",
                [SampleRunPurgeOptions.SectionName + ":Enabled"] = "false",
                [DraftIntakeReaperOptions.SectionName + ":Enabled"] = "false",
                [TenantErasurePurgeOptions.SectionName + ":Enabled"] = "false",
                [TrialArchitecturePreseedOptions.SectionName + ":Enabled"] = "false",
            };

            AddCustomSettings(settings);
            ApiTestWebHostLogging.AddQuietDefaultLogLevel(settings);
            config.AddInMemoryCollection(settings);
        });

        // Integration tests assert the GA bulk-upload cap (200 files per multipart request).
        builder.ConfigureTestServices(services =>
        {
            services.Configure<HostOptions>(static options =>
                options.ShutdownTimeout = TimeSpan.FromSeconds(15));

            services.Configure<FormOptions>(static options =>
                options.ValueCountLimit = EvidenceBulkUploadOptions.FormValueCountLimit);
            services.RemoveAll<IConfigureOptions<EvidenceBulkUploadOptions>>();
            services.RemoveAll<IPostConfigureOptions<EvidenceBulkUploadOptions>>();
            services.AddSingleton<IOptions<EvidenceBulkUploadOptions>>(static _ =>
                Options.Create(new EvidenceBulkUploadOptions { EvidenceBulkUploadMaxFiles = 200 }));
        });
    }

    /// <inheritdoc />
    protected override void ConfigureClient(HttpClient client)
    {
        client.Timeout = IntegrationTestHttpCancellation.DefaultRequestTimeout;
    }

    /// <summary>
    ///     Override to add custom settings to the configuration dictionary before it is built.
    /// </summary>
    protected virtual void AddCustomSettings(Dictionary<string, string?> settings)
    {
    }

    /// <summary>
    ///     Minimal-hosting <see cref="WebApplicationFactory{TEntryPoint}" /> can register DI before
    ///     <see cref="IWebHostBuilder.ConfigureAppConfiguration" /> wins over <c>appsettings.json</c>
    ///     (<c>ConnectionStrings:ArchLucid</c> defaults to <c>Trusted_Connection=True</c>). Sql-backed factories must
    ///     merge the test catalog connection string early so schema bootstrap does not attempt SSPI on Linux CI.
    /// </summary>
    protected void ApplySqlPersistenceHostOverrides(
        IWebHostBuilder builder,
        string sqlConnectionString,
        IReadOnlyDictionary<string, string?>? additionalOverrides = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sqlConnectionString);

        Dictionary<string, string?> overrides = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] = sqlConnectionString,
            ["ArtifactLargePayload:BlobProvider"] = ArtifactBlobProviderForIntegrationTests,
            [EvidenceBulkUploadOptions.MaxFilesKey] = "200",
        };

        Dictionary<string, string?> customSettings = new();
        AddCustomSettings(customSettings);

        foreach (KeyValuePair<string, string?> pair in customSettings)
            overrides[pair.Key] = pair.Value;

        if (additionalOverrides is not null)
        {
            foreach (KeyValuePair<string, string?> pair in additionalOverrides)
                overrides[pair.Key] = pair.Value;
        }

        foreach (KeyValuePair<string, string?> pair in overrides)
        {
            if (pair.Value is null)
                continue;

            builder.UseSetting(pair.Key, pair.Value);
        }

        IConfiguration bootstrap = new ConfigurationBuilder().AddInMemoryCollection(overrides).Build();
        builder.UseConfiguration(bootstrap);

        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(overrides));
    }

    /// <summary>
    ///     Merges test-only settings without replacing the early Sql <see cref="IWebHostBuilder.UseConfiguration" />
    ///     bootstrap (subclasses such as marketplace webhook tests add billing keys this way).
    /// </summary>
    protected void ApplyAdditionalHostOverrides(
        IWebHostBuilder builder,
        IReadOnlyDictionary<string, string?> additionalOverrides)
    {
        foreach (KeyValuePair<string, string?> pair in additionalOverrides)
        {
            if (pair.Value is null)
                continue;

            builder.UseSetting(pair.Key, pair.Value);
        }

        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(additionalOverrides));
    }

    /// <inheritdoc />
    protected override void Dispose(bool disposing)
    {
        if (disposing)
            _artifactBlobEnvironment?.Dispose();

        base.Dispose(disposing);
    }
}
