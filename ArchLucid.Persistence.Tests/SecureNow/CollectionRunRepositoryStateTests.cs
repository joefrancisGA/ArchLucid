using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.SecureNow;

using Dapper;

namespace ArchLucid.Persistence.Tests.SecureNow;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Suite", "Core")]
public sealed class CollectionRunRepositoryStateTests(SqlServerPersistenceFixture fixture)
{
    [Fact]
    [Trait("Category", "Unit")]
    public Task In_memory_preserves_import_when_an_unsuccessful_write_arrives_late() =>
        AssertPreservesImportAsync(new InMemoryCollectionRunRepository(), CreateRunningRun());

    [Fact]
    [Trait("Category", "Unit")]
    public async Task In_memory_does_not_write_a_run_when_the_operation_is_already_canceled()
    {
        InMemoryCollectionRunRepository repository = new();
        CollectionRun run = CreateRunningRun();
        ScopeContext scope = new()
        {
            TenantId = run.TenantId,
            WorkspaceId = run.WorkspaceId,
            ProjectId = run.ProjectId,
        };

        Func<Task> write = () => repository.UpsertAsync(run, new CancellationToken(canceled: true));
        await write.Should().ThrowAsync<OperationCanceledException>();
        (await repository.GetAsync(scope, run.RunId)).Should().BeNull();
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task In_memory_breaks_timestamp_ties_in_sql_run_id_order()
    {
        InMemoryCollectionRunRepository repository = new();
        byte[] hash = new byte[32];
        CollectionRun first = CreateRunningRun() with
        {
            RunId = Guid.Parse("20000000-0000-0000-0000-000000000001"),
            Status = CollectionRunStatus.Imported,
            ImportedSnapshotId = Guid.NewGuid(),
            ZipSha256 = hash,
        };
        CollectionRun second = first with
        {
            RunId = Guid.Parse("10000000-0000-0000-0000-000000000002"),
            ImportedSnapshotId = Guid.NewGuid(),
        };
        ScopeContext scope = new()
        {
            TenantId = first.TenantId,
            WorkspaceId = first.WorkspaceId,
            ProjectId = first.ProjectId,
        };

        await repository.UpsertAsync(first);
        await repository.UpsertAsync(second);

        IReadOnlyList<CollectionRun> page = await repository.ListAsync(scope, offset: 0, limit: 1);
        page.Should().ContainSingle().Which.RunId.Should().Be(second.RunId);
        (await repository.FindImportedSnapshotIdByHashAsync(scope, hash)).Should().Be(second.ImportedSnapshotId);
    }

    [SkippableFact]
    [Trait("Category", "SqlServerContainer")]
    public async Task Sql_preserves_import_when_an_unsuccessful_write_arrives_late()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        CollectionRun running = CreateRunningRun();
        try
        {
            await AssertPreservesImportAsync(new SqlCollectionRunRepository(factory), running);
        }
        finally
        {
            await using var connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);
            await connection.ExecuteAsync(
                """
                DELETE FROM dbo.SecureNowCollectionRuns
                WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId
                  AND ProjectId = @ProjectId AND RunId = @RunId;
                """,
                new { running.TenantId, running.WorkspaceId, running.ProjectId, running.RunId });
        }
    }

    private static async Task AssertPreservesImportAsync(ICollectionRunRepository repository, CollectionRun running)
    {
        ScopeContext scope = new()
        {
            TenantId = running.TenantId, WorkspaceId = running.WorkspaceId, ProjectId = running.ProjectId,
        };
        CollectionRun imported = running with
        {
            Status = CollectionRunStatus.Imported,
            ImportedSnapshotId = Guid.NewGuid(),
            FinishedUtc = running.StartedUtc.AddMinutes(1),
            ZipSha256 = new byte[32],
        };

        await repository.UpsertAsync(running);
        (await repository.GetAsync(scope, running.RunId))!.Status.Should().Be(CollectionRunStatus.Running);
        await repository.UpsertAsync(imported);
        await repository.UpsertAsync(running);
        await repository.UpsertAsync(running with { Status = CollectionRunStatus.Rejected, ErrorSummary = "Invalid manifest" });
        await repository.UpsertAsync(running with { Status = CollectionRunStatus.Failed, ErrorSummary = "Import failed" });

        CollectionRun? stored = await repository.GetAsync(scope, running.RunId);
        stored.Should().BeEquivalentTo(imported);
    }

    private static CollectionRun CreateRunningRun() => new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
        RunId = Guid.NewGuid(),
        AgentVersion = "on-demand",
        StartedUtc = new DateTime(2026, 11, 16, 0, 0, 0, DateTimeKind.Utc),
        Status = CollectionRunStatus.Running,
    };
}
