using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Tests.Support;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]

/// <summary>
///     Shared contract assertions for <see cref="ITechnologyLedgerRepository" />.
/// </summary>
public abstract class TechnologyLedgerRepositoryContractTests
{
    protected virtual void SkipIfSqlServerUnavailable()
    {
    }

    protected abstract ITechnologyLedgerRepository CreateRepository();

    private static TechnologyLedgerEntry NewEntry(string runId, TechnologyLedgerRole role, string technologyName) => new()
    {
        RunId = runId,
        Role = role,
        TechnologyName = technologyName,
        ProviderFamily = CloudProvider.Azure,
        Status = TechnologyLedgerStatus.Chosen,
        Source = TechnologyLedgerSource.User,
    };

    [SkippableFact]
    public async Task Add_GetByRunId_returns_entry_ordered_by_CreatedUtc()
    {
        SkipIfSqlServerUnavailable();
        ITechnologyLedgerRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");

        TechnologyLedgerEntry first = NewEntry(runId, TechnologyLedgerRole.CloudPlatform, "Azure");
        first.CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime.AddMinutes(-2);

        TechnologyLedgerEntry second = NewEntry(runId, TechnologyLedgerRole.PrimaryDatastore, "Azure SQL Database");
        second.CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime.AddMinutes(-1);

        await repo.AddAsync(first, CancellationToken.None);
        await repo.AddAsync(second, CancellationToken.None);

        IReadOnlyList<TechnologyLedgerEntry> list = await repo.GetByRunIdAsync(
            ArchitectureCommitTestSeed.AsScopeContext(), runId, CancellationToken.None);

        list.Should().HaveCount(2);
        list[0].EntryId.Should().Be(first.EntryId);
        list[1].EntryId.Should().Be(second.EntryId);
    }

    [SkippableFact]
    public async Task GetByRunId_only_returns_entries_for_the_requested_run()
    {
        SkipIfSqlServerUnavailable();
        ITechnologyLedgerRepository repo = CreateRepository();
        string runIdA = Guid.NewGuid().ToString("N");
        string runIdB = Guid.NewGuid().ToString("N");

        await repo.AddAsync(NewEntry(runIdA, TechnologyLedgerRole.CloudPlatform, "Azure"), CancellationToken.None);
        await repo.AddAsync(NewEntry(runIdB, TechnologyLedgerRole.CloudPlatform, "AWS"), CancellationToken.None);

        IReadOnlyList<TechnologyLedgerEntry> list = await repo.GetByRunIdAsync(
            ArchitectureCommitTestSeed.AsScopeContext(), runIdA, CancellationToken.None);

        list.Should().ContainSingle();
        list[0].RunId.Should().Be(runIdA);
    }

    [SkippableFact]
    public async Task UpdateAsync_persists_status_and_lock_changes()
    {
        SkipIfSqlServerUnavailable();
        ITechnologyLedgerRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        TechnologyLedgerEntry entry = NewEntry(runId, TechnologyLedgerRole.IdentityProvider, "Entra ID");

        await repo.AddAsync(entry, CancellationToken.None);

        entry.Status = TechnologyLedgerStatus.Assumed;
        entry.IsLocked = true;
        entry.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        await repo.UpdateAsync(entry, CancellationToken.None);

        IReadOnlyList<TechnologyLedgerEntry> list = await repo.GetByRunIdAsync(
            ArchitectureCommitTestSeed.AsScopeContext(), runId, CancellationToken.None);

        list.Should().ContainSingle();
        list[0].Status.Should().Be(TechnologyLedgerStatus.Assumed);
        list[0].IsLocked.Should().BeTrue();
    }

    [SkippableFact]
    public async Task UpdateAsync_for_unknown_entry_does_not_throw()
    {
        SkipIfSqlServerUnavailable();
        ITechnologyLedgerRepository repo = CreateRepository();
        TechnologyLedgerEntry entry = NewEntry(Guid.NewGuid().ToString("N"), TechnologyLedgerRole.Other, "Unknown");

        Func<Task> act = () => repo.UpdateAsync(entry, CancellationToken.None);

        await act.Should().NotThrowAsync();
    }
}
