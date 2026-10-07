using System.Net;

using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Startup.Validation;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Worker.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class WorkerHostStartupTests
{
    [Fact]
    public void Worker_host_environment_variables_override_saas_overlay_from_content_root()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();
        string? priorDemoSeed = Environment.GetEnvironmentVariable("Demo__SaaSGuestSeedEnabled");
        string contentRoot = Path.Combine(Path.GetTempPath(), "archlucid-worker-saas-env-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(contentRoot);

        try
        {
            Environment.SetEnvironmentVariable("Demo__SaaSGuestSeedEnabled", "false");
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.json"),
                """
                {
                  "Hosting": { "Role": "Worker" },
                  "Demo": { "SaaSGuestSeedEnabled": false }
                }
                """);
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.SaaS.json"),
                """
                {
                  "Demo": { "SaaSGuestSeedEnabled": true }
                }
                """);

            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseContentRoot(contentRoot);
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            IConfiguration configuration = factory.Services.GetRequiredService<IConfiguration>();

            configuration["Demo:SaaSGuestSeedEnabled"].Should().Be("false");
        }
        finally
        {
            Environment.SetEnvironmentVariable("Demo__SaaSGuestSeedEnabled", priorDemoSeed);
            snapshot.Restore();

            try
            {
                Directory.Delete(contentRoot, recursive: true);
            }
            catch (IOException)
            {
                // Best-effort temp cleanup on shared CI hosts.
            }
        }
    }

    [Fact]
    public void Worker_host_web_host_use_setting_does_not_beat_saas_overlay_from_content_root()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();
        string contentRoot = Path.Combine(Path.GetTempPath(), "archlucid-worker-saas-usesetting-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(contentRoot);

        try
        {
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.json"),
                """
                {
                  "Hosting": { "Role": "Worker" },
                  "Demo": { "SaaSGuestSeedEnabled": false }
                }
                """);
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.SaaS.json"),
                """
                {
                  "Demo": { "SaaSGuestSeedEnabled": true }
                }
                """);

            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseContentRoot(contentRoot);
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                    builder.UseSetting("Demo:SaaSGuestSeedEnabled", "false");
                });

            IConfiguration configuration = factory.Services.GetRequiredService<IConfiguration>();

            configuration["Demo:SaaSGuestSeedEnabled"].Should().Be("True");
        }
        finally
        {
            snapshot.Restore();

            try
            {
                Directory.Delete(contentRoot, recursive: true);
            }
            catch (IOException)
            {
                // Best-effort temp cleanup on shared CI hosts.
            }
        }
    }

    [Fact]
    public void Worker_host_loads_appsettings_saas_overlay_from_content_root()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();
        string contentRoot = Path.Combine(Path.GetTempPath(), "archlucid-worker-saas-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(contentRoot);

        try
        {
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.json"),
                """
                {
                  "Hosting": { "Role": "Worker" },
                  "Demo": { "SaaSGuestSeedEnabled": false }
                }
                """);
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.SaaS.json"),
                """
                {
                  "Demo": { "SaaSGuestSeedEnabled": true }
                }
                """);

            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseContentRoot(contentRoot);
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            IConfiguration configuration = factory.Services.GetRequiredService<IConfiguration>();

            configuration["Demo:SaaSGuestSeedEnabled"].Should().Be("True");
        }
        finally
        {
            snapshot.Restore();

            try
            {
                Directory.Delete(contentRoot, recursive: true);
            }
            catch (IOException)
            {
                // Best-effort temp cleanup on shared CI hosts.
            }
        }
    }

    [Fact]
    public void Worker_host_skips_pilot_overlay_in_development_from_content_root()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();
        string contentRoot = Path.Combine(Path.GetTempPath(), "archlucid-worker-pilot-dev-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(contentRoot);

        try
        {
            const string economyDeployment = "gpt-pilot-economy";
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.json"),
                """
                {
                  "Hosting": { "Role": "Worker" }
                }
                """);
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.Pilot.json"),
                $$"""
                {
                  "ArchLucid": {
                    "AgentModelTiers": {
                      "EconomyDeploymentName": "{{economyDeployment}}"
                    }
                  }
                }
                """);

            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseContentRoot(contentRoot);
                    builder.UseEnvironment(Environments.Development);
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            IConfiguration configuration = factory.Services.GetRequiredService<IConfiguration>();

            configuration["ArchLucid:AgentModelTiers:EconomyDeploymentName"].Should().BeNull();
        }
        finally
        {
            snapshot.Restore();

            try
            {
                Directory.Delete(contentRoot, recursive: true);
            }
            catch (IOException)
            {
                // Best-effort temp cleanup on shared CI hosts.
            }
        }
    }

    [Fact]
    public void Worker_host_loads_appsettings_pilot_overlay_when_not_development_from_content_root()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();
        string contentRoot = Path.Combine(Path.GetTempPath(), "archlucid-worker-pilot-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(contentRoot);

        try
        {
            const string economyDeployment = "gpt-pilot-economy";
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.json"),
                """
                {
                  "Hosting": { "Role": "Worker" }
                }
                """);
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.Pilot.json"),
                $$"""
                {
                  "ArchLucid": {
                    "AgentModelTiers": {
                      "EconomyDeploymentName": "{{economyDeployment}}"
                    }
                  }
                }
                """);

            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseContentRoot(contentRoot);
                    builder.UseEnvironment("Testing");
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            IConfiguration configuration = factory.Services.GetRequiredService<IConfiguration>();

            configuration["ArchLucid:AgentModelTiers:EconomyDeploymentName"]
                .Should()
                .Be(economyDeployment);
        }
        finally
        {
            snapshot.Restore();

            try
            {
                Directory.Delete(contentRoot, recursive: true);
            }
            catch (IOException)
            {
                // Best-effort temp cleanup on shared CI hosts.
            }
        }
    }

    [Fact]
    public void Worker_host_leaves_modern_max_payload_unset_when_advanced_carries_legacy_context_ingestion_only()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();
        string contentRoot = Path.Combine(Path.GetTempPath(), "archlucid-worker-legacy-payload-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(contentRoot);

        try
        {
            const string legacyMaxPayloadBytes = "77777";
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.json"),
                """
                {
                  "Hosting": { "Role": "Worker" }
                }
                """);
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.Advanced.json"),
                $$"""
                {
                  "ArchLucid": {
                    "ContextIngestion": {
                      "MaxPayloadBytes": {{legacyMaxPayloadBytes}}
                    }
                  }
                }
                """);

            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseContentRoot(contentRoot);
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            IConfiguration configuration = factory.Services.GetRequiredService<IConfiguration>();

            configuration["ArchLucid:ContextIngestion:MaxPayloadBytes"].Should().Be(legacyMaxPayloadBytes);
            configuration[ArchitectureRunCreationPayloadLimitsOptions.MaxPayloadBytesKey].Should().BeNull();
        }
        finally
        {
            snapshot.Restore();

            try
            {
                Directory.Delete(contentRoot, recursive: true);
            }
            catch (IOException)
            {
                // Best-effort temp cleanup on shared CI hosts.
            }
        }
    }

    [Fact]
    public void Worker_host_starts_in_testing_when_archlucid_auth_mode_unset()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseEnvironment("Testing");
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            Action act = () => _ = factory.Services;

            act.Should().NotThrow();
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public void Worker_host_loads_appsettings_advanced_overlay_from_content_root()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();
        string contentRoot = Path.Combine(Path.GetTempPath(), "archlucid-worker-advanced-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(contentRoot);

        try
        {
            const string advancedMaxPayloadBytes = "99999";
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.json"),
                """
                {
                  "Hosting": { "Role": "Worker" }
                }
                """);
            File.WriteAllText(
                Path.Combine(contentRoot, "appsettings.Advanced.json"),
                $$"""
                {
                  "ArchLucid": {
                    "ArchitectureRunCreation": {
                      "MaxPayloadBytes": {{advancedMaxPayloadBytes}}
                    }
                  }
                }
                """);

            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseContentRoot(contentRoot);
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            IConfiguration configuration = factory.Services.GetRequiredService<IConfiguration>();

            configuration[ArchitectureRunCreationPayloadLimitsOptions.MaxPayloadBytesKey]
                .Should()
                .Be(advancedMaxPayloadBytes);
        }
        finally
        {
            snapshot.Restore();

            try
            {
                Directory.Delete(contentRoot, recursive: true);
            }
            catch (IOException)
            {
                // Best-effort temp cleanup on shared CI hosts.
            }
        }
    }

    [Fact]
    public void Worker_host_disables_kestrel_server_header()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            KestrelServerOptions options = factory.Services.GetRequiredService<IOptions<KestrelServerOptions>>().Value;

            options.AddServerHeader.Should().BeFalse();
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public void Worker_host_fails_fast_when_transactional_outbox_requires_sql_but_storage_is_in_memory()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("IntegrationEvents:TransactionalOutboxEnabled", "true");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            Action act = () => _ = factory.Services;

            act.Should()
                .Throw<InvalidOperationException>()
                .WithMessage("*ArchLucid configuration is invalid*");
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public void Worker_host_starts_when_real_mode_uses_managed_identity_without_api_key()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                    builder.UseSetting("AgentExecution:Mode", "Real");
                    builder.UseSetting("AzureOpenAI:Endpoint", "https://example.openai.azure.com/");
                    builder.UseSetting("AzureOpenAI:DeploymentName", "gpt");
                    builder.UseSetting("AzureOpenAI:AuthenticationMode", "ManagedIdentity");
                    builder.UseSetting("LlmCompletionCache:Enabled", "false");
                });

            Action act = () => _ = factory.Services;

            act.Should().NotThrow();
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public void Worker_host_fails_fast_when_hosting_role_is_api()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("Hosting:Role", "Api");
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            Action act = () => _ = factory.Services;

            act.Should()
                .Throw<InvalidOperationException>()
                .WithMessage("*Hosting:Role=Worker*");
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public void Worker_host_fails_fast_when_production_uses_in_memory_storage()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseEnvironment(Environments.Production);
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            Action act = () => _ = factory.Services;

            act.Should()
                .Throw<InvalidOperationException>()
                .WithMessage("*ArchLucid configuration is invalid*");
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public void Worker_host_fails_fast_when_prometheus_enabled_without_scrape_credentials()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                    builder.UseSetting("Observability:Prometheus:Enabled", "true");
                });

            Action act = () => _ = factory.Services;

            act.Should()
                .Throw<InvalidOperationException>()
                .WithMessage("*Prometheus*");
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public void Worker_host_starts_when_real_mode_uses_azure_openai_environment_aliases()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();
        string? priorEndpoint = Environment.GetEnvironmentVariable("AZURE_OPENAI_ENDPOINT");
        string? priorDeployment = Environment.GetEnvironmentVariable("AZURE_OPENAI_DEPLOYMENT_NAME");
        string? priorApiKey = Environment.GetEnvironmentVariable("AZURE_OPENAI_API_KEY");

        try
        {
            Environment.SetEnvironmentVariable("AZURE_OPENAI_ENDPOINT", "https://example.openai.azure.com/");
            Environment.SetEnvironmentVariable("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt");
            Environment.SetEnvironmentVariable("AZURE_OPENAI_API_KEY", "test-key");

            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                    builder.UseSetting("AgentExecution:Mode", "Real");
                    builder.UseSetting("LlmCompletionCache:Enabled", "false");
                });

            Action act = () => _ = factory.Services;

            act.Should().NotThrow();
        }
        finally
        {
            Environment.SetEnvironmentVariable("AZURE_OPENAI_ENDPOINT", priorEndpoint);
            Environment.SetEnvironmentVariable("AZURE_OPENAI_DEPLOYMENT_NAME", priorDeployment);
            Environment.SetEnvironmentVariable("AZURE_OPENAI_API_KEY", priorApiKey);
            snapshot.Restore();
        }
    }

    [Fact]
    public void Worker_host_fails_fast_when_simulator_has_negative_max_completion_tokens()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                    builder.UseSetting("AgentExecution:Mode", "Simulator");
                    builder.UseSetting("AzureOpenAI:MaxCompletionTokens", "-1");
                });

            Action act = () => _ = factory.Services;

            act.Should()
                .Throw<InvalidOperationException>()
                .WithMessage("*ArchLucid configuration is invalid*")
                .WithMessage("*MaxCompletionTokens*");
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public void CollectErrors_rejects_negative_max_completion_tokens_in_simulator_mode()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["AgentExecution:Mode"] = "Simulator",
            ["AzureOpenAI:MaxCompletionTokens"] = "-1",
            ["ArchLucidAuth:Authority"] = "https://mock.example.com/",
            ["ArchLucidAuth:Audience"] = "mock",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns("Development");

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .ContainSingle(e => e.Contains("MaxCompletionTokens", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectErrors_rejects_transactional_outbox_with_in_memory_storage()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["IntegrationEvents:TransactionalOutboxEnabled"] = "true",
            ["ArchLucidAuth:Authority"] = "https://mock.example.com/",
            ["ArchLucidAuth:Audience"] = "mock",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns("Development");

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .Contain(
                e => e.Contains("IntegrationEvents:TransactionalOutboxEnabled", StringComparison.Ordinal)
                    && e.Contains("Sql", StringComparison.Ordinal),
                "the worker should fail fast when outbox is enabled without durable SQL.");
    }

    [Fact]
    public void Worker_host_configures_graceful_shutdown_timeout()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            HostOptions hostOptions = factory.Services.GetRequiredService<IOptions<HostOptions>>().Value;

            hostOptions.ShutdownTimeout.Should().Be(TimeSpan.FromSeconds(45));
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public void Worker_host_starts_when_legacy_product_section_keys_are_present()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                    builder.UseSetting("ArchiForge:IgnoredLegacyFlag", "true");
                });

            Action act = () => _ = factory.Services;

            act.Should().NotThrow();
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public void Worker_host_defaults_hosting_role_to_worker_when_configuration_omits_role()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            IConfiguration configuration = factory.Services.GetRequiredService<IConfiguration>();

            configuration["Hosting:Role"].Should().Be("Worker");
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public async Task Worker_host_health_live_returns_ok_when_pipeline_is_mapped()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            using HttpClient client = factory.CreateClient();

            HttpResponseMessage response = await client.GetAsync("/health/live");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public async Task Worker_host_health_live_succeeds_on_plain_http_urls_in_non_development()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseEnvironment("Testing");
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                    builder.UseSetting("ASPNETCORE_URLS", "http://127.0.0.1:0");
                });

            using HttpClient client = factory.CreateClient();

            HttpResponseMessage response = await client.GetAsync("/health/live");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public async Task Worker_host_health_root_returns_summary_json_without_exception_text()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            using HttpClient client = factory.CreateClient();

            HttpResponseMessage response = await client.GetAsync("/health");

            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);
            response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
            string body = await response.Content.ReadAsStringAsync();
            body.Should().NotContain("exception", because: "summary health must not echo exception text");
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public async Task Worker_host_health_ready_returns_anonymous_summary_json()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            using HttpClient client = factory.CreateClient();

            HttpResponseMessage response = await client.GetAsync("/health/ready");

            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);
            response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
            string body = await response.Content.ReadAsStringAsync();
            body.Should().NotContain("exception", because: "summary health must not echo exception text");
        }
        finally
        {
            snapshot.Restore();
        }
    }
}
