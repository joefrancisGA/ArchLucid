using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Sql;

[Trait("Category", "Unit")]
public sealed class SqlRunRepositoryListGuardTests
{
    [Fact]
    public async Task ListByProjectKeysetAsync_throws_keyset_validation_before_scoped_tenant()
    {
        ScopeContext unscoped = new()
        {
            TenantId = Guid.Empty,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        SqlRunRepository repository = CreateRepositoryThatMustNotOpenConnections();

        Func<Task> act = () => repository.ListByProjectKeysetAsync(
            unscoped,
            "billing",
            DateTime.UtcNow,
            null,
            10,
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task ListByProjectKeysetAsync_throws_scoped_tenant_before_opening_connection()
    {
        ScopeContext unscoped = new()
        {
            TenantId = Guid.Empty,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        SqlRunRepository repository = CreateRepositoryThatMustNotOpenConnections();

        Func<Task> act = () => repository.ListByProjectKeysetAsync(
            unscoped,
            "billing",
            null,
            null,
            10,
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*TenantId must be set*");
    }

    private static SqlRunRepository CreateRepositoryThatMustNotOpenConnections()
    {
        TestSqlConnectionFactory sqlFactory = new("Server=127.0.0.1,1;Connection Timeout=1;TrustServerCertificate=true");
        NeverOpenAuthorityRunListConnectionFactory listFactory = new();

        return new SqlRunRepository(
            sqlFactory,
            listFactory,
            DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(sqlFactory));
    }

    private sealed class NeverOpenAuthorityRunListConnectionFactory : IAuthorityRunListConnectionFactory
    {
        public Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("List query must not open a connection when guards fail first.");
    }
}
