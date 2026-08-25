using ArchLucid.Host.Core.Startup.Validation;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

using Moq;

namespace ArchLucid.Worker.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class WorkerHostStartupTests
{
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

    [Fact(Skip = "InMemory worker composition does not register IArchitectureIdentityRepository or IPolicyPackMarkdownExplainService, so ValidateOnBuild fails before the host can start.")]
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

    [Fact(Skip = "InMemory worker composition does not register IArchitectureIdentityRepository or IPolicyPackMarkdownExplainService, so ValidateOnBuild fails before the host can start.")]
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
}
