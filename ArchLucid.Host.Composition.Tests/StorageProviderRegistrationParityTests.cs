using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Coordination.Diagnostics;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.Retrieval;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using SqlConnectionFactory = ArchLucid.Persistence.Connections.SqlConnectionFactory;

namespace ArchLucid.Host.Composition.Tests;

/// <summary>
///     Ensures <see cref="ArchLucidStorageServiceCollectionExtensions.AddArchLucidStorage" /> registers the same
///     <see cref="ServiceDescriptor.ServiceType" /> surface for InMemory and Sql except for known provider-specific types.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StorageProviderRegistrationParityTests
{
    private static readonly HashSet<Type> SqlOnlyServiceTypes =
    [
        typeof(ITenantDatabaseBindingRepository),
        typeof(ITenantDatabaseResolver),
        typeof(ScopedRoutingSqlConnectionFactory),
        typeof(ISqlConnectionFactory),
        typeof(IAuthorityRunListConnectionFactory),
        typeof(IGovernanceResolutionReadConnectionFactory),
        typeof(IGoldenManifestLookupReadConnectionFactory),
        typeof(ISchemaBootstrapper),
        typeof(IDbConnectionFactory),
        typeof(IOptionsChangeTokenSource<SqlServerOptions>),
        typeof(IConfigureOptions<SqlServerOptions>),
        typeof(IOptionsChangeTokenSource<WarmTenantCatalogOptions>),
        typeof(IConfigureOptions<WarmTenantCatalogOptions>),
        typeof(ITenantOnboardingStateRepository),
        typeof(SqlAuthorityPipelineTenantExecutionLeaseRepository),
        typeof(SqlConnectionFactory),
        typeof(ResilientSqlConnectionFactory),
        typeof(IBackgroundWorkerSqlConnectionFactory),
        typeof(SqlResilientOperationExecutor),
        typeof(IWarmTenantCatalogReplenishService),
        typeof(IAuditSqlRetryPolicyProvider),
    ];

    private static readonly HashSet<Type> InMemoryOnlyServiceTypes =
    [
        typeof(InMemoryAuditRepository),
        typeof(InMemoryRetrievalGroundingTraceWriter),
    ];

    [Fact]
    public void AddArchLucidStorage_InMemory_and_Sql_register_same_service_types_except_allowlisted()
    {
        HashSet<Type> inMemoryTypes = CollectServiceTypesAfterStorage(CreateInMemoryConfiguration());
        HashSet<Type> sqlTypes = CollectServiceTypesAfterStorage(CreateSqlConfiguration());

        IEnumerable<Type> onlyInMemory = inMemoryTypes.Except(sqlTypes);
        IEnumerable<Type> onlyInSql = sqlTypes.Except(inMemoryTypes);

        IEnumerable<Type> unexpectedInMemory = onlyInMemory.Where(t => !InMemoryOnlyServiceTypes.Contains(t));
        IEnumerable<Type> unexpectedSql = onlyInSql.Where(t => !SqlOnlyServiceTypes.Contains(t));

        unexpectedInMemory.Should().BeEmpty(
            "every service type registered only for InMemory should be allowlisted (or added to both paths)");

        unexpectedSql.Should().BeEmpty(
            "every service type registered only for Sql should be allowlisted (or added to both paths)");
    }

    private static HashSet<Type> CollectServiceTypesAfterStorage(IConfiguration configuration)
    {
        ServiceCollection services = [];
        services.AddSingleton(typeof(IConfiguration), configuration);
        services.AddLogging();
        _ = services.AddArchLucidStorage(configuration);

        return ToServiceTypeSet(services);
    }

    private static HashSet<Type> CollectServiceTypesAfterFullComposition(IConfiguration configuration)
    {
        ServiceCollection services = [];
        services.AddSingleton(typeof(IConfiguration), configuration);
        services.AddLogging();
        _ = services.AddArchLucidStorage(configuration);
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        return ToServiceTypeSet(services);
    }

    private static HashSet<Type> ToServiceTypeSet(IServiceCollection services)
    {
        HashSet<Type> set = [];

        foreach (ServiceDescriptor descriptor in services)
            set.Add(descriptor.ServiceType);

        return set;
    }

    private static IConfiguration CreateInMemoryConfiguration()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucid:StorageProvider"] = "InMemory",
                    ["ConnectionStrings:ArchLucid"] = InMemoryStartupSqlConnectionStringSentinel.Value,
                    ["HotPathCache:Enabled"] = "false",
                    ["LlmCompletionCache:Enabled"] = "false",
                    ["Hosting:Role"] = "Api",
                    ["AgentExecution:Mode"] = "Simulator",
                    ["AzureOpenAI:Endpoint"] = "",
                    ["AzureOpenAI:ApiKey"] = "",
                    ["AzureOpenAI:DeploymentName"] = "",
                    ["AzureOpenAI:EmbeddingDeploymentName"] = "",
                    ["FeatureManagement:FeatureFlags:AsyncAuthorityPipeline"] = "false",
                    ["RateLimiting:FixedWindow:PermitLimit"] = "100000",
                    ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
                    ["RateLimiting:Expensive:PermitLimit"] = "100000",
                    ["RateLimiting:Expensive:WindowMinutes"] = "1"
                })
            .Build();
    }

    private static IConfiguration CreateSqlConfiguration()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucid:StorageProvider"] = "Sql",
                    ["ConnectionStrings:ArchLucid"] =
                        "Server=.;Database=ArchLucidParityTests;Trusted_Connection=True;TrustServerCertificate=True",
                    ["HotPathCache:Enabled"] = "false",
                    ["LlmCompletionCache:Enabled"] = "false",
                    ["Hosting:Role"] = "Api",
                    ["AgentExecution:Mode"] = "Simulator",
                    ["AzureOpenAI:Endpoint"] = "",
                    ["AzureOpenAI:ApiKey"] = "",
                    ["AzureOpenAI:DeploymentName"] = "",
                    ["AzureOpenAI:EmbeddingDeploymentName"] = "",
                    ["FeatureManagement:FeatureFlags:AsyncAuthorityPipeline"] = "false",
                    ["RateLimiting:FixedWindow:PermitLimit"] = "100000",
                    ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
                    ["RateLimiting:Expensive:PermitLimit"] = "100000",
                    ["RateLimiting:Expensive:WindowMinutes"] = "1"
                })
            .Build();
    }
}
