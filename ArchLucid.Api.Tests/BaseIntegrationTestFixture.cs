using ArchLucid.Core.Configuration;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Base fixture for <see cref="WebApplicationFactory{TEntryPoint}" /> that unifies common setup code
///     such as environment, storage provider, rate limits, and logging.
/// </summary>
public abstract class BaseIntegrationTestFixture : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // JWT E2E factories set process env vars that win over in-memory DevelopmentBypass settings in Program.cs.
        JwtIntegrationTestEnvironmentOverrides.Clear();

        builder.UseEnvironment("Development");

        builder.UseSetting("DataConsistency:InitialDelaySeconds", "0");
        builder.UseSetting("HostLeaderElection:Enabled", "false");
        // appsettings.Advanced.json defaults BlobProvider=None; bulk evidence writes require a writable store.
        builder.UseSetting("ArtifactLargePayload:BlobProvider", "Local");
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
                ["ArtifactLargePayload:BlobProvider"] = "Local",
                // Each integration host indexes platform ADR + policy-pack corpora by default; skip in tests (CI memory/time).
                ["Retrieval:PlatformDocs:IndexOnStartup"] = "false",
                ["Retrieval:PolicyPackCorpus:IndexOnStartup"] = "false",
                [EvidenceBulkUploadOptions.MaxFilesKey] = "200",
            };

            AddCustomSettings(settings);
            ApiTestWebHostLogging.AddQuietDefaultLogLevel(settings);
            config.AddInMemoryCollection(settings);
        });

        // Integration tests assert the GA bulk-upload cap (200 files per multipart request).
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IConfigureOptions<EvidenceBulkUploadOptions>>();
            services.RemoveAll<IPostConfigureOptions<EvidenceBulkUploadOptions>>();
            services.AddSingleton<IOptions<EvidenceBulkUploadOptions>>(static _ =>
                Options.Create(new EvidenceBulkUploadOptions { EvidenceBulkUploadMaxFiles = 200 }));
        });
    }

    /// <summary>
    ///     Override to add custom settings to the configuration dictionary before it is built.
    /// </summary>
    protected virtual void AddCustomSettings(Dictionary<string, string?> settings)
    {
    }
}
