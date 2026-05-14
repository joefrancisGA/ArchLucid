using ArchLucid.Host.Core.Startup.Validation;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

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
