using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

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
}
