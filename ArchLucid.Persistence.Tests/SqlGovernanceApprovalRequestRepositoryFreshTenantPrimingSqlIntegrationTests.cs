using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     SQL integration coverage for production <see cref="GovernanceApprovalRequestRepository" /> tenant priming
///     (fresh DevelopmentBypass scopes without a pre-existing <c>dbo.Tenants</c> row).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlGovernanceApprovalRequestRepositoryFreshTenantPrimingSqlIntegrationTests(
    SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task CreateAsync_fresh_tenant_id_primes_parent_row_and_persists_approval()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid freshTenantId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = freshTenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        GovernanceApprovalRequestRepository repository = new(
            new GovernanceContractScopeDbConnectionFactory(fixture.ConnectionString),
            new FixedTestScopeContextProvider(scope));

        await using (SqlConnection verify = new(fixture.ConnectionString))
        {
            await verify.OpenAsync(CancellationToken.None);

            int before = await verify.QuerySingleAsync<int>(
                new CommandDefinition(
                    "SELECT COUNT(1) FROM dbo.Tenants WHERE Id = @Id;",
                    new { Id = freshTenantId },
                    cancellationToken: CancellationToken.None));

            before.Should().Be(0, "test must start without a dbo.Tenants parent for the fresh scope id.");
        }

        string approvalId = "apr-fresh-tenant-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");

        GovernanceApprovalRequest approval = new()
        {
            ApprovalRequestId = approvalId,
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            ManifestVersion = "v1",
            SourceEnvironment = GovernanceEnvironment.Dev,
            TargetEnvironment = GovernanceEnvironment.Test,
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = "alice",
            RequestedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await repository.CreateAsync(approval, CancellationToken.None);

        await using (SqlConnection verifyAfter = new(fixture.ConnectionString))
        {
            await verifyAfter.OpenAsync(CancellationToken.None);

            int tenantRows = await verifyAfter.QuerySingleAsync<int>(
                new CommandDefinition(
                    "SELECT COUNT(1) FROM dbo.Tenants WHERE Id = @Id;",
                    new { Id = freshTenantId },
                    cancellationToken: CancellationToken.None));

            tenantRows.Should().Be(1);
        }

        GovernanceApprovalRequest? loaded = await repository.GetByIdAsync(approvalId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.ApprovalRequestId.Should().Be(approvalId);
        loaded.TenantId.Should().Be(freshTenantId);
    }

    [SkippableFact]
    public async Task CreateAsync_existing_provisioned_tenant_row_is_not_mutated_by_priming()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid tenantId = Guid.NewGuid();
        string organizationName = "Reg Org " + Guid.NewGuid().ToString("N");
        string slug = TenantSlugNormalizer.FromName(organizationName);
        string expectedTier = TenantTierSql.ToTierString(TenantTier.Free);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository tenantRepository =
            DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);

        await tenantRepository.InsertTenantAsync(
            tenantId,
            organizationName,
            slug,
            TenantTier.Free,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        GovernanceApprovalRequestRepository repository = new(
            new GovernanceContractScopeDbConnectionFactory(fixture.ConnectionString),
            new FixedTestScopeContextProvider(scope));

        string approvalId = "apr-existing-tenant-" + Guid.NewGuid().ToString("N");

        GovernanceApprovalRequest approval = new()
        {
            ApprovalRequestId = approvalId,
            RunId = Guid.NewGuid().ToString("N"),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            ManifestVersion = "v1",
            SourceEnvironment = GovernanceEnvironment.Dev,
            TargetEnvironment = GovernanceEnvironment.Test,
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = "alice",
            RequestedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await repository.CreateAsync(approval, CancellationToken.None);

        await using SqlConnection verify = new(fixture.ConnectionString);
        await verify.OpenAsync(CancellationToken.None);

        (string Name, string Slug, string Tier) tenantRow = await verify.QuerySingleAsync<(string Name, string Slug, string Tier)>(
            new CommandDefinition(
                """
                SELECT Name, Slug, Tier
                FROM dbo.Tenants
                WHERE Id = @Id;
                """,
                new { Id = tenantId },
                cancellationToken: CancellationToken.None));

        tenantRow.Name.Should().Be(organizationName);
        tenantRow.Slug.Should().Be(slug);
        tenantRow.Tier.Should().Be(expectedTier);

        GovernanceApprovalRequest? loaded = await repository.GetByIdAsync(approvalId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.TenantId.Should().Be(tenantId);
    }
}
