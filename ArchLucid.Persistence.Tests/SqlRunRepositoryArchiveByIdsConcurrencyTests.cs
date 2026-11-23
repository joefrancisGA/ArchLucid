using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Concurrent <see cref="IRunRepository.ArchiveRunsByIdsAsync" /> calls: exactly one batch should archive an
///     unarchived run;
///     overlapping calls may classify duplicates as failures without corrupting state.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class SqlRunRepositoryArchiveByIdsConcurrencyTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task ArchiveRunsByIdsForScopeAsync_filters_foreign_rows_at_the_sql_update()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory sqlFactory = new(fixture.ConnectionString);
        TestAuthorityRunListConnectionFactory listFactory = new(sqlFactory);
        SqlRunRepository repo = SqlRunRepositoryTestFactory.Create(sqlFactory, listFactory);

        ScopeContext owner = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };
        ScopeContext foreign = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };
        RunRecord ownRun = new()
        {
            RunId = Guid.NewGuid(), TenantId = owner.TenantId,
            WorkspaceId = owner.WorkspaceId, ScopeProjectId = owner.ProjectId,
            ProjectId = "scoped_archive_" + Guid.NewGuid().ToString("N"),
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
        RunRecord foreignRun = new()
        {
            RunId = Guid.NewGuid(), TenantId = foreign.TenantId,
            WorkspaceId = foreign.WorkspaceId, ScopeProjectId = foreign.ProjectId,
            ProjectId = "scoped_archive_" + Guid.NewGuid().ToString("N"),
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
        await repo.SaveAsync(ownRun, CancellationToken.None);
        await repo.SaveAsync(foreignRun, CancellationToken.None);

        RunArchiveByIdsResult result = await repo.ArchiveRunsByIdsForScopeAsync(
            owner, [ownRun.RunId, foreignRun.RunId], CancellationToken.None);

        result.SucceededRunIds.Should().ContainSingle().Which.Should().Be(ownRun.RunId);
        result.Failed.Should().ContainSingle(f => f.RunId == foreignRun.RunId
            && f.Reason == "Run not found.");
        (await repo.GetByIdAsync(owner, ownRun.RunId, CancellationToken.None)).Should().BeNull();
        (await repo.GetByIdAsync(foreign, foreignRun.RunId, CancellationToken.None))
            .Should().NotBeNull("foreign project run must not be archived");
    }

    [SkippableFact]
    public async Task ArchiveRunsByIdsAsync_four_parallel_calls_first_archives_others_see_already_archived()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory sqlFactory = new(fixture.ConnectionString);
        TestAuthorityRunListConnectionFactory listFactory = new(sqlFactory);
        SqlRunRepository repo = SqlRunRepositoryTestFactory.Create(sqlFactory, listFactory);

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };

        Guid runId = Guid.NewGuid();
        string slug = "conc_arch_" + Guid.NewGuid().ToString("N");

        RunRecord run = new()
        {
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = slug,
            Description = "concurrency archive",
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        await repo.SaveAsync(run, CancellationToken.None);

        const int parallel = 4;
        Task<RunArchiveByIdsResult>[] tasks = new Task<RunArchiveByIdsResult>[parallel];

        for (int i = 0; i < parallel; i++)
        {
            tasks[i] = repo.ArchiveRunsByIdsAsync([runId], CancellationToken.None);
        }

        RunArchiveByIdsResult[] results = await Task.WhenAll(tasks);

        int archiveWins = results.Sum(r => r.SucceededRunIds.Count(id => id == runId));
        archiveWins.Should().Be(1, "only one archive batch should succeed for the same unarchived run row");

        // GetByIdAsync excludes archived rows (ArchivedUtc IS NULL); assert persistence via dbo.Runs.
        await using SqlConnection verify = new(fixture.ConnectionString);
        await verify.OpenAsync(CancellationToken.None);

        DateTime? archivedUtc = await verify.QuerySingleOrDefaultAsync<DateTime?>(
            new CommandDefinition(
                "SELECT ArchivedUtc FROM dbo.Runs WHERE RunId = @RunId;",
                new { RunId = runId },
                cancellationToken: CancellationToken.None));

        archivedUtc.Should().NotBeNull("dbo.Runs should carry ArchivedUtc after exactly one winning archive");
    }
}
