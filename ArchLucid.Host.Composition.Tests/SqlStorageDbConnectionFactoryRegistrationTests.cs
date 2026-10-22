using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Core.DataAccess;
using ArchLucid.Persistence.Data.Infrastructure;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Tests;

/// <summary>
///     Documents the single SQL-host registration path for <see cref="IDbConnectionFactory" /> (scoped
///     <see cref="ArchLucid.Persistence.Connections.ISqlConnectionFactory" /> via
///     <see cref="SqlScopedResolutionDbConnectionFactory" />).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SqlStorageDbConnectionFactoryRegistrationTests
{
    [Fact]
    public void AddArchLucidStorage_Sql_resolves_IDbConnectionFactory_as_SqlScopedResolutionDbConnectionFactory()
    {
        IConfiguration configuration = CreateSqlConfiguration();
        ServiceCollection services = [];
        services.AddSingleton(typeof(IConfiguration), configuration);
        services.AddLogging();
        _ = services.AddArchLucidStorage(configuration);

        ServiceProvider provider = services.BuildServiceProvider();
        IDbConnectionFactory factory = provider.GetRequiredService<IDbConnectionFactory>();

        factory.Should().BeOfType<SqlScopedResolutionDbConnectionFactory>();
    }

    private static IConfiguration CreateSqlConfiguration()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucid:StorageProvider"] = "Sql",
                    ["ConnectionStrings:ArchLucid"] =
                        "Server=.;Database=ArchLucidRegistrationTests;Trusted_Connection=True;TrustServerCertificate=True",
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
