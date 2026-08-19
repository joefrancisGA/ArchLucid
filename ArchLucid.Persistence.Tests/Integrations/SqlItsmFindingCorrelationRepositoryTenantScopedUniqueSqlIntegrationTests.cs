using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

using Polly;

namespace ArchLucid.Persistence.Tests.Integrations;

/// <summary>
///     TB-389 — tenant-scoped <c>ItsmFindingCorrelations</c> external-key uniqueness.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
public sealed class SqlItsmFindingCorrelationRepositoryTenantScopedUniqueSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task RegisterAsync_allows_same_provider_external_key_across_tenants()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory connectionFactory = new(fixture.ConnectionString);
        DapperTenantRepository tenants = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(connectionFactory);
        SqlItsmFindingCorrelationRepository sut = CreateRepository(connectionFactory);

        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();
        Guid workspaceA = Guid.NewGuid();
        Guid workspaceB = Guid.NewGuid();
        Guid projectA = Guid.NewGuid();
        Guid projectB = Guid.NewGuid();
        const string externalKey = "PROJ-389";

        await SeedTenantAsync(connectionFactory, tenants, tenantA, workspaceA, projectA);
        await SeedTenantAsync(connectionFactory, tenants, tenantB, workspaceB, projectB);

        await sut.RegisterAsync(
            tenantA,
            workspaceA,
            projectA,
            "finding-a",
            "Jira",
            externalKey,
            null,
            null,
            CancellationToken.None);

        await sut.RegisterAsync(
            tenantB,
            workspaceB,
            projectB,
            "finding-b",
            "Jira",
            externalKey,
            null,
            null,
            CancellationToken.None);

        ItsmFindingCorrelationRecord? rowA =
            await sut.TryGetByFindingAndProviderAsync(tenantA, "finding-a", "Jira", CancellationToken.None);

        ItsmFindingCorrelationRecord? rowB =
            await sut.TryGetByFindingAndProviderAsync(tenantB, "finding-b", "Jira", CancellationToken.None);

        rowA.Should().NotBeNull();
        rowB.Should().NotBeNull();
        rowA!.ExternalKey.Should().Be(externalKey);
        rowB!.ExternalKey.Should().Be(externalKey);
    }

    [SkippableFact]
    public async Task RegisterAsync_rejects_duplicate_provider_external_key_within_same_tenant()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory connectionFactory = new(fixture.ConnectionString);
        DapperTenantRepository tenants = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(connectionFactory);
        SqlItsmFindingCorrelationRepository sut = CreateRepository(connectionFactory);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        const string externalKey = "PROJ-389-dup";

        await SeedTenantAsync(connectionFactory, tenants, tenantId, workspaceId, projectId);

        await sut.RegisterAsync(
            tenantId,
            workspaceId,
            projectId,
            "finding-1",
            "Jira",
            externalKey,
            null,
            null,
            CancellationToken.None);

        Func<Task> duplicateInsert = async () =>
        {
            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(CancellationToken.None);

            const string sql = """
                               INSERT INTO dbo.ItsmFindingCorrelations
                                   (TenantId, WorkspaceId, ProjectId, FindingId, Provider, ExternalKey)
                               VALUES
                                   (@TenantId, @WorkspaceId, @ProjectId, @FindingId, @Provider, @ExternalKey);
                               """;

            await connection.ExecuteAsync(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    FindingId = "finding-2",
                    Provider = "Jira",
                    ExternalKey = externalKey
                });
        };

        await duplicateInsert.Should().ThrowAsync<SqlException>();

        IReadOnlyList<ItsmFindingCorrelationRecord> rows =
            await sut.ListByFindingAsync(tenantId, "finding-1", CancellationToken.None);

        rows.Should().ContainSingle();
        rows[0].ExternalKey.Should().Be(externalKey);
    }

    [SkippableFact]
    public async Task TryGetByExternalKeyAsync_returns_null_when_same_key_registered_for_multiple_tenants()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory connectionFactory = new(fixture.ConnectionString);
        DapperTenantRepository tenants = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(connectionFactory);
        SqlItsmFindingCorrelationRepository sut = CreateRepository(connectionFactory);

        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();
        Guid workspaceA = Guid.NewGuid();
        Guid workspaceB = Guid.NewGuid();
        Guid projectA = Guid.NewGuid();
        Guid projectB = Guid.NewGuid();
        const string externalKey = "PROJ-389-ambiguous";

        await SeedTenantAsync(connectionFactory, tenants, tenantA, workspaceA, projectA);
        await SeedTenantAsync(connectionFactory, tenants, tenantB, workspaceB, projectB);

        await sut.RegisterAsync(tenantA, workspaceA, projectA, "finding-a", "Jira", externalKey, null, null, CancellationToken.None);
        await sut.RegisterAsync(tenantB, workspaceB, projectB, "finding-b", "Jira", externalKey, null, null, CancellationToken.None);

        ItsmFindingCorrelationRecord? ambiguous =
            await sut.TryGetByExternalKeyAsync("Jira", externalKey, CancellationToken.None);

        ambiguous.Should().BeNull();
    }

    private static SqlItsmFindingCorrelationRepository CreateRepository(TestSqlConnectionFactory connectionFactory)
    {
        ResiliencePipeline pipeline = SqlOpenResilienceDefaults.BuildSqlOperationRetryPipeline(
            maxRetryAttempts: 0,
            baseDelay: TimeSpan.FromMilliseconds(1));

        BackgroundWorkerResilientSqlConnectionFactory workerFactory = new(
            new SqlConnectionFactory(connectionFactory.ConnectionString),
            pipeline);
        SqlResilientOperationExecutor executor = new(pipeline);

        return new SqlItsmFindingCorrelationRepository(workerFactory, executor);
    }

    private static async Task SeedTenantAsync(
        TestSqlConnectionFactory connectionFactory,
        DapperTenantRepository tenants,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        await tenants.InsertTenantAsync(
            tenantId,
            "TB-389 tenant",
            "tb389-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        await tenants.InsertWorkspaceAsync(
            workspaceId,
            tenantId,
            "ws",
            projectId,
            CancellationToken.None);

        DapperArchitectureProjectRepository projects = new(connectionFactory);

        await projects.InsertAsync(projectId, tenantId, workspaceId, "default", CancellationToken.None);
    }
}
