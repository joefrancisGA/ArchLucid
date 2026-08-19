using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

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
