using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     SQL integration coverage for <see cref="SqlRunRepository.GetByIdAsync" /> scope isolation (TB-301).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlRunRepositoryScopeIsolationSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly ScopeContext ScopeA = new()
    {
        TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1"),
        WorkspaceId = Guid.Parse("a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2"),
        ProjectId = Guid.Parse("a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3"),
    };

    [SkippableFact]
    public async Task GetById_wrong_scope_returns_null_when_run_saved_under_other_tenant()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory sqlFactory = new(fixture.ConnectionString);
        TestAuthorityRunListConnectionFactory listFactory = new(sqlFactory);
        SqlRunRepository repository = SqlRunRepositoryTestFactory.Create(sqlFactory, listFactory);

        RunRecord run = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = ScopeA.TenantId,
            WorkspaceId = ScopeA.WorkspaceId,
            ScopeProjectId = ScopeA.ProjectId,
            ProjectId = "scope-iso-run",
            Description = "scope-iso",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await repository.SaveAsync(run, CancellationToken.None);

        ScopeContext scopeB = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = ScopeA.WorkspaceId,
            ProjectId = ScopeA.ProjectId,
        };

        RunRecord? leaked = await repository.GetByIdAsync(scopeB, run.RunId, CancellationToken.None);

        leaked.Should().BeNull("orchestrator run reads must not resolve under a different tenant scope.");

        RunRecord? owned = await repository.GetByIdAsync(ScopeA, run.RunId, CancellationToken.None);

        owned.Should().NotBeNull();
    }
}
