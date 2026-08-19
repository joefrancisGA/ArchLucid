using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Scoping;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     SQL integration coverage for <see cref="SqlContextSnapshotRepository.GetByIdAsync" /> scope isolation (TB-073).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlContextSnapshotRepositoryScopeIsolationSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly ScopeContext ScopeA = new()
    {
        TenantId = Guid.Parse("f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1"),
        WorkspaceId = Guid.Parse("f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2"),
        ProjectId = Guid.Parse("f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3"),
    };

    [SkippableFact]
    public async Task GetById_wrong_scope_returns_null_when_context_saved_under_other_tenant()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        await AuthorityRunChainTestSeed.InsertRunAsync(
            connection,
            ScopeA.TenantId,
            ScopeA.WorkspaceId,
            ScopeA.ProjectId,
            runId,
            "ctx-scope-iso",
            CancellationToken.None);

        string emptyList = JsonEntitySerializer.Serialize(new List<string>());

        await AuthorityRunChainTestSeed.InsertContextSnapshotHeaderAsync(
            connection,
            ScopeA.TenantId,
            ScopeA.WorkspaceId,
            ScopeA.ProjectId,
            contextId,
            runId,
            "ctx-scope-iso",
            TimeProvider.System.UtcNowDateTime(),
            "[]",
            null,
            emptyList,
            emptyList,
            JsonEntitySerializer.Serialize(new Dictionary<string, string>()),
            CancellationToken.None);

        SqlContextSnapshotRepository repository = new(factory, new FixedPersistenceScopeContextProvider(ScopeA));

        ReadScopeTriple scopeB = new(Guid.NewGuid(), ScopeA.WorkspaceId, ScopeA.ProjectId);

        ContextSnapshot? leaked = await repository.GetByIdAsync(scopeB, contextId, CancellationToken.None);

        leaked.Should().BeNull("leaked context snapshot GUID must not resolve under a different tenant scope.");

        ContextSnapshot? owned = await repository.GetByIdAsync(ScopeA.ToReadScope(), contextId, CancellationToken.None);

        owned.Should().NotBeNull();
    }
}
