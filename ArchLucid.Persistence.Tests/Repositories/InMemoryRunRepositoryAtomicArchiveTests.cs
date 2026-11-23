using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
public sealed class InMemoryRunRepositoryAtomicArchiveTests
{
    [Fact]
    public async Task Explicit_archive_changes_row_version_once_and_rejects_stale_update()
    {
        InMemoryRunRepository repo = new();
        ScopeContext scope = NewScope();
        RunRecord input = NewRun(scope);
        await repo.SaveAsync(input, CancellationToken.None);

        RunRecord stale = (await repo.GetByIdAsync(scope, input.RunId, CancellationToken.None))!;
        byte[] oldVersion = stale.RowVersion!.ToArray();

        RunArchiveByIdsResult first = await repo.ArchiveRunsByIdsAsync([input.RunId], CancellationToken.None);
        first.SucceededRunIds.Should().ContainSingle().Which.Should().Be(input.RunId);

        RunRecord archived = (await repo.GetByIdIncludingArchivedAsync(
            scope, input.RunId, CancellationToken.None))!;
        archived.ArchivedUtc.Should().NotBeNull();
        archived.Description.Should().Be("original");
        archived.RowVersion.Should().NotEqual(oldVersion);

        stale.Description = "stale overwrite";
        Func<Task> update = () => repo.UpdateAsync(stale, CancellationToken.None);
        await update.Should().ThrowAsync<RunConcurrencyConflictException>();

        RunArchiveByIdsResult repeat = await repo.ArchiveRunsByIdsAsync([input.RunId], CancellationToken.None);
        repeat.ArchivedRuns.Should().BeEmpty();
        repeat.Failed.Should().ContainSingle(failure =>
            failure.RunId == input.RunId && failure.Reason == "Run already archived.");
    }

    [Fact]
    public async Task Concurrent_cutoff_archives_count_a_run_once()
    {
        InMemoryRunRepository repo = new();
        ScopeContext scope = NewScope();
        RunRecord input = NewRun(scope);
        await repo.SaveAsync(input, CancellationToken.None);

        DateTimeOffset cutoff = new(input.CreatedUtc.AddDays(1), TimeSpan.Zero);
        Task<RunArchiveBatchResult>[] concurrent = Enumerable.Range(0, 32)
            .Select(_ => Task.Run(() =>
                repo.ArchiveRunsCreatedBeforeForScopeAsync(scope, cutoff, CancellationToken.None)))
            .ToArray();

        RunArchiveBatchResult[] reports = await Task.WhenAll(concurrent);
        reports.Sum(report => report.UpdatedCount).Should().Be(1);
        reports.Sum(report => report.ArchivedRuns.Count).Should().Be(1);
        (await repo.GetByIdIncludingArchivedAsync(scope, input.RunId, CancellationToken.None))!
            .ArchivedUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task Concurrent_unsealed_archive_and_seal_have_exactly_one_winner()
    {
        for (int attempt = 0; attempt < 32; attempt++)
        {
            InMemoryRunRepository repo = new();
            ScopeContext scope = NewScope();
            RunRecord input = NewRun(scope);
            Guid manifestId = Guid.NewGuid();
            await repo.SaveAsync(input, CancellationToken.None);

            Task<bool> sealing = Task.Run(async () =>
            {
                try
                {
                    await repo.MarkAuthorityPipelineCommittedAsync(
                        scope, input.RunId, manifestId, DateTime.UtcNow, CancellationToken.None);
                    return true;
                }
                catch (RunConcurrencyConflictException)
                {
                    return false;
                }
            });

            Task<RunArchiveByIdsResult> archival = Task.Run(() =>
                repo.ArchiveUnsealedRunAsync(scope, input.RunId, CancellationToken.None));

            await Task.WhenAll(sealing, archival);
            bool sealedRun = await sealing;
            bool archivedRun = (await archival).SucceededRunIds.Contains(input.RunId);
            (sealedRun ^ archivedRun).Should().BeTrue(
                "a run must never be both archived as unsealed and sealed in the current row");

            RunRecord current = (await repo.GetByIdIncludingArchivedAsync(
                scope, input.RunId, CancellationToken.None))!;

            if (sealedRun)
            {
                current.GoldenManifestId.Should().Be(manifestId);
                current.ArchivedUtc.Should().BeNull();
            }
            else
            {
                current.GoldenManifestId.Should().BeNull();
                current.ArchivedUtc.Should().NotBeNull();
            }
        }
    }

    [Fact]
    public async Task Archiving_blocks_later_governance_writes_and_preserves_previous_values()
    {
        InMemoryRunRepository repo = new();
        ScopeContext scope = NewScope();
        RunRecord input = NewRun(scope);
        await repo.SaveAsync(input, CancellationToken.None);

        (await repo.TrySetOperatorGovernanceDispositionAsync(
            scope, input.RunId, "Approved", "prior decision", "reviewer",
            DateTime.UtcNow, CancellationToken.None)).Should().BeTrue();

        RunRecord before = (await repo.GetByIdAsync(scope, input.RunId, CancellationToken.None))!;
        await repo.ArchiveRunsByIdsAsync([input.RunId], CancellationToken.None);

        (await repo.TrySetOperatorGovernanceDispositionAsync(
            scope, input.RunId, "Denied", "after archive", "other",
            DateTime.UtcNow, CancellationToken.None)).Should().BeFalse();

        RunRecord archived = (await repo.GetByIdIncludingArchivedAsync(
            scope, input.RunId, CancellationToken.None))!;
        archived.OperatorGovernanceDecision.Should().Be("Approved");
        archived.OperatorGovernanceDecisionRationale.Should().Be("prior decision");
        archived.OperatorGovernanceDecisionByUserId.Should().Be("reviewer");
        archived.RowVersion.Should().NotEqual(before.RowVersion);
    }

    [Fact]
    public async Task Clearing_open_graph_never_mutates_sealed_run_or_detached_snapshots()
    {
        InMemoryRunRepository repo = new();
        ScopeContext scope = NewScope();
        Guid architectureId = Guid.NewGuid();
        RunRecord run = NewRun(scope);
        run.ArchitectureId = architectureId;
        run.GraphSnapshotId = Guid.NewGuid();
        await repo.SaveAsync(run, CancellationToken.None);

        RunRecord stale = (await repo.GetByIdAsync(scope, run.RunId, CancellationToken.None))!;
        IReadOnlyList<Guid> cleared = await repo.ClearGraphSnapshotForArchitectureAsync(
            scope, architectureId, CancellationToken.None);
        cleared.Should().ContainSingle().Which.Should().Be(run.RunId);
        stale.GraphSnapshotId.Should().NotBeNull();

        RunRecord updated = (await repo.GetByIdAsync(scope, run.RunId, CancellationToken.None))!;
        updated.GraphSnapshotId.Should().BeNull();
        updated.RowVersion.Should().NotEqual(stale.RowVersion);

        Guid manifestId = Guid.NewGuid();
        await repo.MarkAuthorityPipelineCommittedAsync(
            scope, run.RunId, manifestId, DateTime.UtcNow, CancellationToken.None);
        IReadOnlyList<Guid> repeat = await repo.ClearGraphSnapshotForArchitectureAsync(
            scope, architectureId, CancellationToken.None);
        repeat.Should().BeEmpty();
        (await repo.GetByIdAsync(scope, run.RunId, CancellationToken.None))!
            .GoldenManifestId.Should().Be(manifestId);
    }

    private static ScopeContext NewScope() => new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    private static RunRecord NewRun(ScopeContext scope) => new()
    {
        RunId = Guid.NewGuid(),
        TenantId = scope.TenantId,
        WorkspaceId = scope.WorkspaceId,
        ScopeProjectId = scope.ProjectId,
        ProjectId = "archive-cas-test",
        Description = "original",
        CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime.AddDays(-2),
        IsSample = true,
    };
}
