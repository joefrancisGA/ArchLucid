using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
public sealed class InMemoryFindingsSnapshotScopedReadTests
{
    private static readonly ScopeContext TenantAScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly ScopeContext TenantBScope = new()
    {
        TenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        WorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        ProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
    };

    [Fact]
    public async Task GetByIdAsync_rejects_cross_tenant_scope_when_snapshot_saved_with_scope()
    {
        InMemoryFindingsSnapshotRepository repository =
            new(new FixedPersistenceScopeContextProvider(TenantAScope));

        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            Findings =
            [
                new Finding
                {
                    FindingId = "f-1",
                    FindingType = "Security",
                    Category = "Security",
                    EngineType = "Test",
                    Severity = FindingSeverity.Warning,
                    Title = "probe",
                    Rationale = "probe",
                },
            ],
        };

        await repository.SaveAsync(snapshot, CancellationToken.None);

        FindingsSnapshot? crossTenant =
            await repository.GetByIdAsync(TenantBScope, snapshot.FindingsSnapshotId, CancellationToken.None);

        crossTenant.Should().BeNull();
    }

    [Fact]
    public async Task ListFindingRecordsKeysetAsync_returns_empty_page_for_cross_tenant_scope()
    {
        InMemoryFindingsSnapshotRepository repository =
            new(new FixedPersistenceScopeContextProvider(TenantAScope));

        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            Findings =
            [
                new Finding
                {
                    FindingId = "f-1",
                    FindingType = "Security",
                    Category = "Security",
                    EngineType = "Test",
                    Severity = FindingSeverity.Warning,
                    Title = "probe",
                    Rationale = "probe",
                },
            ],
        };

        await repository.SaveAsync(snapshot, CancellationToken.None);

        FindingRecordMetadataPage page = await repository.ListFindingRecordsKeysetAsync(
            TenantBScope,
            snapshot.FindingsSnapshotId,
            cursorSortOrder: null,
            cursorFindingRecordId: null,
            cursorPriorityRank: null,
            severity: null,
            category: null,
            findingType: null,
            take: FindingPagination.DefaultTake,
            orderByPriority: false,
            CancellationToken.None);

        page.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task Evicted_snapshot_does_not_keep_priority_ranks_when_saved_again()
    {
        InMemoryFindingsSnapshotRepository repository =
            new(new FixedPersistenceScopeContextProvider(TenantAScope));
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            Findings =
            [
                new Finding
                {
                    FindingId = "f-1",
                    FindingType = "Security",
                    Category = "Security",
                    EngineType = "Test",
                    Severity = FindingSeverity.Warning,
                    Title = "probe",
                    Rationale = "probe",
                },
            ],
        };

        await repository.SaveAsync(snapshot, CancellationToken.None);
        await repository.UpdatePriorityRanksAsync(TenantAScope, snapshot.FindingsSnapshotId,
            [("f-1", 1)], CancellationToken.None);
        FindingRecordMetadataPage before = await ReadPageAsync();
        before.Items.Single().PriorityRank.Should().Be(1);

        for (int index = 0; index < FindingsSnapshotRepositoryCore.MaxInMemoryEntries; index++)
        {
            await repository.SaveAsync(new FindingsSnapshot
            {
                FindingsSnapshotId = Guid.NewGuid(),
                RunId = Guid.NewGuid(),
                Findings = [],
            }, CancellationToken.None);
        }

        (await repository.GetByIdAsync(TenantAScope, snapshot.FindingsSnapshotId, CancellationToken.None))
            .Should().BeNull();

        await repository.SaveAsync(snapshot, CancellationToken.None);
        FindingRecordMetadataPage after = await ReadPageAsync();
        after.Items.Single().PriorityRank.Should().BeNull();

        Task<FindingRecordMetadataPage> ReadPageAsync() => repository.ListFindingRecordsKeysetAsync(
            TenantAScope, snapshot.FindingsSnapshotId, cursorSortOrder: null, cursorFindingRecordId: null,
            cursorPriorityRank: null, severity: null, category: null, findingType: null,
            take: 1, orderByPriority: true, CancellationToken.None);
    }
}
