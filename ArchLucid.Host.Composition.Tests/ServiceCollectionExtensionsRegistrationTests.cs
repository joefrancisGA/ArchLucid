using ArchLucid.Application.Integrations;
using ArchLucid.Application.Value;
using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Persistence.Value;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Composition.Tests;

/// <summary>
///     Exercises <see cref="ServiceCollectionExtensions.AddArchLucidApplicationServices" /> for each
///     <see cref="ArchLucidHostingRole" /> so composition registration branches (worker vs API vs combined)
///     contribute to line coverage without starting Kestrel.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ServiceCollectionExtensionsRegistrationTests
{
    [Theory]
    [InlineData(ArchLucidHostingRole.Api)]
    [InlineData(ArchLucidHostingRole.Worker)]
    [InlineData(ArchLucidHostingRole.Combined)]
    public void AddArchLucidApplicationServices_does_not_throw_for_hosting_role(ArchLucidHostingRole role)
    {
        IConfiguration configuration = CreateCompositionTestConfiguration(role);
        ServiceCollection services = [];

        Action act = () => _ = services.AddArchLucidApplicationServices(configuration, role);

        act.Should().NotThrow();
    }

    [Fact]
    public void CosmosGraphSnapshotOutboxHostedService_is_not_registered_when_GraphSnapshotsEnabled_is_false()
    {
        IConfiguration configuration = CreateSqlCompositionTestConfiguration(
            ArchLucidHostingRole.Combined,
            graphSnapshotsEnabled: false);
        ServiceCollection services = [];

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Combined);

        bool registered = services.Any(static d =>
            d.ServiceType == typeof(IHostedService) &&
            d.ImplementationType == typeof(CosmosGraphSnapshotOutboxHostedService));

        registered.Should().BeFalse(
            "CosmosGraphSnapshotOutboxHostedService must not start when CosmosDb:GraphSnapshotsEnabled=false " +
            "because CosmosGraphSnapshotRepository is not registered and the processor would throw on every poll");
    }

    [Fact]
    public void CosmosGraphSnapshotOutboxHostedService_is_registered_when_Sql_and_GraphSnapshotsEnabled()
    {
        IConfiguration configuration = CreateSqlCompositionTestConfiguration(
            ArchLucidHostingRole.Combined,
            graphSnapshotsEnabled: true);
        ServiceCollection services = [];

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Combined);

        bool registered = services.Any(static d =>
            d.ServiceType == typeof(IHostedService) &&
            d.ImplementationType == typeof(CosmosGraphSnapshotOutboxHostedService));

        registered.Should().BeTrue(
            "CosmosGraphSnapshotOutboxHostedService must be registered when StorageProvider=Sql and CosmosDb:GraphSnapshotsEnabled=true");
    }

    [Fact]
    public void CosmosGraphSnapshotOutboxHostedService_is_not_registered_for_Api_role_even_when_GraphSnapshotsEnabled()
    {
        IConfiguration configuration = CreateSqlCompositionTestConfiguration(
            ArchLucidHostingRole.Api,
            graphSnapshotsEnabled: true);
        ServiceCollection services = [];

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        bool registered = services.Any(static d =>
            d.ServiceType == typeof(IHostedService) &&
            d.ImplementationType == typeof(CosmosGraphSnapshotOutboxHostedService));

        registered.Should().BeFalse(
            "CosmosGraphSnapshotOutboxHostedService is a worker-role hosted service and must not run on Api-only nodes");
    }

    [Fact]
    public async Task AddArchLucidApplicationServices_value_report_async_job_poll_works_across_separate_api_replica_roots()
    {
        static IValueReportJobQueue BuildReplicaQueue()
        {
            IConfiguration configuration = CreateCompositionTestConfiguration(ArchLucidHostingRole.Api);
            ServiceCollection services = [];
            services.AddSingleton(typeof(IConfiguration), configuration);
            services.AddLogging();

            Mock<IValueReportMetricsReader> metrics = new();
            metrics
                .Setup(m => m.ReadAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<DateTimeOffset>(),
                    It.IsAny<DateTimeOffset>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValueReportRawMetrics([], 1, 1, 0, 0, 0, 0, null, null, null, null, 0, null, null, null));

            services.AddSingleton(metrics.Object);
            services.AddSingleton(Mock.Of<IValueReportRenderer>());
            services.AddSingleton(Mock.Of<IAuditService>());

            _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

            ServiceProvider provider = services.BuildServiceProvider();

            return provider.GetRequiredService<IValueReportJobQueue>();
        }

        Guid tenantId = Guid.NewGuid();
        ValueReportJobRequest request = new(
            tenantId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddDays(-30),
            DateTimeOffset.UtcNow);

        IValueReportJobQueue enqueueReplica = BuildReplicaQueue();
        IValueReportJobQueue pollReplica = BuildReplicaQueue();

        Guid jobId = enqueueReplica.Enqueue(request);

        ValueReportJobPollResult? observed = null;

        for (int attempt = 0; attempt < 40; attempt++)
        {
            ValueReportJobPollResult poll = pollReplica.TryPoll(jobId, tenantId);

            if (poll.Found)
            {
                observed = poll;
                break;
            }

            await Task.Delay(25);
        }

        observed.Should().NotBeNull(
            "async value report jobs must be pollable from another Api replica via shared IDistributedCache state");
        observed!.Found.Should().BeTrue();
    }

    [Fact]
    public void AddArchLucidApplicationServices_registers_outbound_webhook_dry_run_probe()
    {
        IConfiguration configuration = CreateCompositionTestConfiguration(ArchLucidHostingRole.Combined);
        ServiceCollection services = [];

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Combined);

        bool registered = services.Any(static d =>
            d.ServiceType == typeof(IOutboundWebhookDryRunService));

        registered.Should().BeTrue(
            "Host.Composition must register the outbound webhook dry-run probe consumed by WebhookSubscriptionTestService");
    }

    private static IConfiguration CreateSqlCompositionTestConfiguration(
        ArchLucidHostingRole role,
        bool graphSnapshotsEnabled)
    {
        string roleString = role switch
        {
            ArchLucidHostingRole.Api => "Api",
            ArchLucidHostingRole.Worker => "Worker",
            _ => "Combined"
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Hosting:Role"] = roleString,
                    ["ConnectionStrings:ArchLucid"] =
                        "Server=localhost;Database=ArchLucidCompositionTests;Trusted_Connection=True;TrustServerCertificate=True",
                    ["ArchLucid:StorageProvider"] = "Sql",
                    ["AgentExecution:Mode"] = "Simulator",
                    ["AzureOpenAI:Endpoint"] = "",
                    ["AzureOpenAI:ApiKey"] = "",
                    ["AzureOpenAI:DeploymentName"] = "",
                    ["AzureOpenAI:EmbeddingDeploymentName"] = "",
                    ["RateLimiting:FixedWindow:PermitLimit"] = "100000",
                    ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
                    ["RateLimiting:Expensive:PermitLimit"] = "100000",
                    ["RateLimiting:Expensive:WindowMinutes"] = "1",
                    ["CosmosDb:GraphSnapshotsEnabled"] = graphSnapshotsEnabled ? "true" : "false"
                })
            .Build();
    }

    private static IConfiguration CreateCompositionTestConfiguration(ArchLucidHostingRole role)
    {
        string roleString = role switch
        {
            ArchLucidHostingRole.Api => "Api",
            ArchLucidHostingRole.Worker => "Worker",
            _ => "Combined"
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Hosting:Role"] = roleString,
                    ["ConnectionStrings:ArchLucid"] =
                        "Server=localhost;Database=ArchLucidCompositionTests;Trusted_Connection=True;TrustServerCertificate=True",
                    ["ArchLucid:StorageProvider"] = "InMemory",
                    ["AgentExecution:Mode"] = "Simulator",
                    ["AzureOpenAI:Endpoint"] = "",
                    ["AzureOpenAI:ApiKey"] = "",
                    ["AzureOpenAI:DeploymentName"] = "",
                    ["AzureOpenAI:EmbeddingDeploymentName"] = "",
                    ["RateLimiting:FixedWindow:PermitLimit"] = "100000",
                    ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
                    ["RateLimiting:Expensive:PermitLimit"] = "100000",
                    ["RateLimiting:Expensive:WindowMinutes"] = "1"
                })
            .Build();
    }
}
