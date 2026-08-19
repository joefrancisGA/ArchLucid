using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     SQL integration coverage for <see cref="SqlFindingsSnapshotRepository.GetByIdAsync" /> scope isolation (TB-073).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlFindingsSnapshotRepositoryScopeIsolationSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly ScopeContext ScopeA = new()
    {
        TenantId = Guid.Parse("d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1"),
        WorkspaceId = Guid.Parse("d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2"),
        ProjectId = Guid.Parse("d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3"),
    };

    [SkippableFact]
    public async Task GetById_wrong_scope_returns_null_when_snapshot_saved_under_other_tenant()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        await AuthorityRunChainTestSeed.SeedRunAndContextOnlyAsync(
            connection,
            ScopeA.TenantId,
            ScopeA.WorkspaceId,
            ScopeA.ProjectId,
            runId,
            contextId,
            "scope-iso",
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

        SqlFindingsSnapshotRepository repository = new(
            factory,
            new TestReadOnlyDbConnectionFactory(factory),
            new FixedPersistenceScopeContextProvider(ScopeA));

        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = findingsId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Findings =
            [
                new Finding
                {
                    FindingId = "scope-iso-finding",
                    FindingType = "Security",
                    Category = "Security",
                    EngineType = "Test",
                    Severity = FindingSeverity.Warning,
                    Title = "scope",
                    Rationale = "scope",
                },
            ],
        };

        await repository.SaveAsync(snapshot, CancellationToken.None);

        ScopeContext scopeB = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = ScopeA.WorkspaceId,
            ProjectId = ScopeA.ProjectId,
        };

        FindingsSnapshot? leaked = await repository.GetByIdAsync(scopeB, findingsId, CancellationToken.None);

        leaked.Should().BeNull("leaked snapshot GUID must not resolve under a different tenant scope.");

        FindingsSnapshot? owned = await repository.GetByIdAsync(ScopeA, findingsId, CancellationToken.None);

        owned.Should().NotBeNull();
    }
}
