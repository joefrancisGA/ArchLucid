using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
///     TB-310: committed run header evidence-anchor immutability on <c>dbo.Runs</c>.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class CommittedRunHeaderImmutabilitySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Trigger_exists_after_migration_250()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();

        int exists = await connection.QuerySingleAsync<int>(
            "SELECT CASE WHEN OBJECT_ID(@TriggerName, N'TR') IS NULL THEN 0 ELSE 1 END;",
            new { TriggerName = CommittedRunHeaderAnchorRegistry.TriggerName });

        exists.Should().Be(1, "migration 250 must create TR_Runs_SealCommittedHeader");
    }

    [SkippableFact]
    public async Task Pre_commit_anchor_update_succeeds()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid runId = Guid.NewGuid();
        string requestId = "pre-commit-" + Guid.NewGuid().ToString("N");

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();
        await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(connection, requestId, runId.ToString("N"), CancellationToken.None);

        Guid contextId = Guid.NewGuid();

        int rows = await connection.ExecuteAsync(
            """
            UPDATE dbo.Runs
            SET ContextSnapshotId = @ContextSnapshotId
            WHERE RunId = @RunId;
            """,
            new { RunId = runId, ContextSnapshotId = contextId });

        rows.Should().Be(1);
    }

    [SkippableFact]
    public async Task Commit_transition_sets_golden_manifest_id()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        string requestId = "commit-" + Guid.NewGuid().ToString("N");

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();
        await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(connection, requestId, runId.ToString("N"), CancellationToken.None);

        int rows = await connection.ExecuteAsync(
            """
            UPDATE dbo.Runs
            SET GoldenManifestId = @GoldenManifestId,
                LegacyRunStatus = N'Committed',
                CompletedUtc = SYSUTCDATETIME()
            WHERE RunId = @RunId;
            """,
            new { RunId = runId, GoldenManifestId = manifestId });

        rows.Should().Be(1);
    }

    [SkippableFact]
    public async Task Post_commit_anchor_update_raises_trigger_error()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        string requestId = "post-commit-anchor-" + Guid.NewGuid().ToString("N");

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();
        await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(connection, requestId, runId.ToString("N"), CancellationToken.None);

        await connection.ExecuteAsync(
            """
            UPDATE dbo.Runs
            SET GoldenManifestId = @GoldenManifestId,
                LegacyRunStatus = N'Committed',
                CompletedUtc = SYSUTCDATETIME()
            WHERE RunId = @RunId;
            """,
            new { RunId = runId, GoldenManifestId = manifestId });

        Func<Task> act = async () =>
        {
            await connection.ExecuteAsync(
                """
                UPDATE dbo.Runs
                SET ContextSnapshotId = @ContextSnapshotId
                WHERE RunId = @RunId;
                """,
                new { RunId = runId, ContextSnapshotId = Guid.NewGuid() });
        };

        SqlException ex = (await act.Should().ThrowAsync<SqlException>()).Which;
        ex.Number.Should().Be(CommittedRunHeaderAnchorRegistry.TriggerErrorNumber);
    }

    [SkippableFact]
    public async Task Post_commit_lifecycle_update_succeeds()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        string requestId = "post-commit-life-" + Guid.NewGuid().ToString("N");

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();
        await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(connection, requestId, runId.ToString("N"), CancellationToken.None);

        await connection.ExecuteAsync(
            """
            UPDATE dbo.Runs
            SET GoldenManifestId = @GoldenManifestId,
                LegacyRunStatus = N'Committed',
                CompletedUtc = SYSUTCDATETIME()
            WHERE RunId = @RunId;
            """,
            new { RunId = runId, GoldenManifestId = manifestId });

        int rows = await connection.ExecuteAsync(
            """
            UPDATE dbo.Runs
            SET IsPinned = 1,
                Description = N'pinned reference run'
            WHERE RunId = @RunId;
            """,
            new { RunId = runId });

        rows.Should().Be(1);
    }

    [SkippableFact]
    public async Task SqlRunRepository_update_throws_when_anchor_mutates_on_committed_run()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        ScopeContext scope = ArchitectureCommitTestSeed.AsScopeContext();
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        string requestId = "repo-guard-" + Guid.NewGuid().ToString("N");

        TestSqlConnectionFactory sqlFactory = new(fixture.ConnectionString);
        TestAuthorityRunListConnectionFactory listFactory = new(sqlFactory);
        SqlRunRepository repository = SqlRunRepositoryTestFactory.Create(sqlFactory, listFactory);

        await using (SqlConnection seed = new(fixture.ConnectionString))
        {
            await seed.OpenAsync();
            await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(seed, requestId, runId.ToString("N"), CancellationToken.None);
        }

        RunRecord? loaded = await repository.GetByIdAsync(scope, runId, CancellationToken.None);
        loaded.Should().NotBeNull();

        RunRecord committed = loaded!;
        committed.GoldenManifestId = manifestId;
        committed.LegacyRunStatus = "Committed";
        committed.CompletedUtc = DateTime.UtcNow;
        await repository.UpdateAsync(committed, CancellationToken.None);

        RunRecord? reloaded = await repository.GetByIdAsync(scope, runId, CancellationToken.None);
        reloaded.Should().NotBeNull();

        RunRecord mutated = reloaded!;
        mutated.ContextSnapshotId = Guid.NewGuid();

        Func<Task> act = () => repository.UpdateAsync(mutated, CancellationToken.None);

        await act.Should().ThrowAsync<RunEvidenceAnchorImmutableException>()
            .Where(ex => ex.RunId == runId);
    }
}
