using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

/// <summary>
/// Concurrent <see cref="IRunRepository.ArchiveRunsByIdsAsync"/> calls: exactly one batch should archive an unarchived run;
/// overlapping calls may classify duplicates as failures without corrupting state.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class SqlRunRepositoryArchiveByIdsConcurrencyTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task ArchiveRunsByIdsAsync_four_parallel_calls_first_archives_others_see_already_archived()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory sqlFactory = new(fixture.ConnectionString);
        TestAuthorityRunListConnectionFactory listFactory = new(sqlFactory);
        SqlRunRepository repo = new(sqlFactory, listFactory);

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
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
            CreatedUtc = DateTime.UtcNow,
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

        RunRecord? loaded = await repo.GetByIdAsync(scope, runId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded!.ArchivedUtc.Should().NotBeNull();
    }
}
