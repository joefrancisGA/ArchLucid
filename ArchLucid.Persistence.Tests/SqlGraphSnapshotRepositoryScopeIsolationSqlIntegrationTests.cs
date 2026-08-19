using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     SQL integration coverage for <see cref="SqlGraphSnapshotRepository.GetByIdAsync" /> scope isolation (TB-073).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlGraphSnapshotRepositoryScopeIsolationSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly ScopeContext ScopeA = new()
    {
        TenantId = Guid.Parse("e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1"),
        WorkspaceId = Guid.Parse("e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2"),
        ProjectId = Guid.Parse("e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3"),
    };

    [SkippableFact]
    public async Task GetById_wrong_scope_returns_null_when_graph_saved_under_other_tenant()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        await AuthorityRunChainTestSeed.SeedRunAndContextOnlyAsync(
            connection,
            ScopeA.TenantId,
            ScopeA.WorkspaceId,
            ScopeA.ProjectId,
            runId,
            contextId,
            "graph-scope-iso",
            CancellationToken.None);

        await AuthorityRunChainTestSeed.InsertGraphSnapshotHeaderAsync(
            connection,
            ScopeA.TenantId,
            ScopeA.WorkspaceId,
            ScopeA.ProjectId,
            graphId,
            contextId,
            runId,
            TimeProvider.System.UtcNowDateTime(),
            JsonEntitySerializer.Serialize(new List<GraphNode>()),
            JsonEntitySerializer.Serialize(new List<GraphEdge>()),
            JsonEntitySerializer.Serialize(new List<string>()),
            CancellationToken.None);

        SqlGraphSnapshotRepository repository = new(factory, new FixedPersistenceScopeContextProvider(ScopeA));

        ScopeContext scopeB = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = ScopeA.WorkspaceId,
            ProjectId = ScopeA.ProjectId,
        };

        GraphSnapshot? leaked = await repository.GetByIdAsync(scopeB, graphId, CancellationToken.None);

        leaked.Should().BeNull("leaked graph snapshot GUID must not resolve under a different tenant scope.");

        GraphSnapshot? owned = await repository.GetByIdAsync(ScopeA, graphId, CancellationToken.None);

        owned.Should().NotBeNull();
    }
}
