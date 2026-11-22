using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
public sealed class InMemoryRunRepositoryDetachedSnapshotTests
{
    [Fact]
    public async Task Saved_input_and_returned_scoped_run_cannot_mutate_stored_identity_or_pins()
    {
        InMemoryRunRepository repository = new();
        ScopeContext owner = NewScope();
        RunRecord input = NewRun(owner);
        Guid runId = input.RunId;
        await repository.SaveAsync(input, CancellationToken.None);

        // Saving must detach from caller-owned state.
        input.TenantId = Guid.NewGuid();
        input.GoldenManifestId = Guid.NewGuid();
        input.PinnedPolicyPackIdsHashSha256![0] = 99;
        input.RowVersion![0] ^= 0xFF;

        RunRecord first = (await repository.GetByIdAsync(owner, runId, CancellationToken.None))!;
        first.Should().NotBeNull();
        first.TenantId.Should().Be(owner.TenantId);
        first.GoldenManifestId.Should().BeNull();
        first.PinnedPolicyPackIdsHashSha256.Should().Equal(1, 2, 3, 4);
        first.Should().NotBeSameAs(input);

        // A query must return a second detached copy of the stored row.
        byte[] stableVersion = first.RowVersion!.ToArray();
        first.TenantId = Guid.NewGuid();
        first.WorkspaceId = Guid.NewGuid();
        first.ScopeProjectId = Guid.NewGuid();
        first.LegacyRunStatus = "Committed";
        first.PinnedPolicyPackIdsHashSha256![1] = 88;
        first.RowVersion![0] ^= 0x7F;

        RunRecord later = (await repository.GetByIdAsync(owner, runId, CancellationToken.None))!;
        later.TenantId.Should().Be(owner.TenantId);
        later.WorkspaceId.Should().Be(owner.WorkspaceId);
        later.ScopeProjectId.Should().Be(owner.ProjectId);
        later.LegacyRunStatus.Should().Be("Created");
        later.PinnedPolicyPackIdsHashSha256.Should().Equal(1, 2, 3, 4);
        later.RowVersion.Should().Equal(stableVersion);

        ScopeContext foreign = new()
        {
            TenantId = first.TenantId,
            WorkspaceId = owner.WorkspaceId,
            ProjectId = owner.ProjectId,
        };
        (await repository.GetByIdAsync(foreign, runId, CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task List_and_admin_query_results_are_detached_from_store()
    {
        InMemoryRunRepository repository = new();
        ScopeContext scope = NewScope();
        RunRecord input = NewRun(scope);
        await repository.SaveAsync(input, CancellationToken.None);

        RunRecord listed = (await repository.ListRecentInScopeAsync(
            scope, 10, CancellationToken.None)).Single();
        listed.Description = "externally modified";
        listed.PinnedPolicyPackIdsHashSha256![0] = 55;

        RunRecord byProject = (await repository.ListByProjectAsync(
            scope, input.ProjectId, 10, CancellationToken.None)).Single();
        byProject.Description.Should().Be("Original");
        byProject.PinnedPolicyPackIdsHashSha256.Should().Equal(1, 2, 3, 4);

        RunRecord admin = (await repository.GetByRunIdAdminAsync(
            input.RunId, CancellationToken.None))!;
        admin.ProjectId = "different";
        admin.RowVersion![0] ^= 0xFF;

        RunRecord archivedQuery = (await repository.GetByIdIncludingArchivedAsync(
            scope, input.RunId, CancellationToken.None))!;
        archivedQuery.ProjectId.Should().Be(input.ProjectId);

        RunRecord current = (await repository.GetByIdAsync(
            scope, input.RunId, CancellationToken.None))!;
        current.ProjectId.Should().Be(input.ProjectId);
        current.Description.Should().Be("Original");
    }

    [Fact]
    public async Task Stale_update_is_rejected_after_another_reader_writes()
    {
        InMemoryRunRepository repository = new();
        ScopeContext scope = NewScope();
        RunRecord input = NewRun(scope);
        await repository.SaveAsync(input, CancellationToken.None);

        RunRecord first = (await repository.GetByIdAsync(scope, input.RunId, CancellationToken.None))!;
        RunRecord second = (await repository.GetByIdAsync(scope, input.RunId, CancellationToken.None))!;

        first.Description = "First writer";
        await repository.UpdateAsync(first, CancellationToken.None);

        second.Description = "Stale writer";
        Func<Task> stale = () => repository.UpdateAsync(second, CancellationToken.None);
        await stale.Should().ThrowAsync<RunConcurrencyConflictException>();

        RunRecord stored = (await repository.GetByIdAsync(scope, input.RunId, CancellationToken.None))!;
        stored.Description.Should().Be("First writer");
        stored.RowVersion.Should().Equal(first.RowVersion);
    }

    [Fact]
    public async Task Update_must_not_change_persisted_scope_or_its_identity()
    {
        InMemoryRunRepository repository = new();
        ScopeContext scope = NewScope();
        RunRecord input = NewRun(scope);
        await repository.SaveAsync(input, CancellationToken.None);

        RunRecord changed = (await repository.GetByIdAsync(
            scope, input.RunId, CancellationToken.None))!;
        changed.TenantId = Guid.NewGuid();

        Func<Task> illegal = () => repository.UpdateAsync(changed, CancellationToken.None);
        await illegal.Should().ThrowAsync<RunConcurrencyConflictException>();

        RunRecord original = (await repository.GetByIdAsync(
            scope, input.RunId, CancellationToken.None))!;
        original.TenantId.Should().Be(scope.TenantId);
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
        ProjectId = "aspects-snapshot",
        Description = "Original",
        IsSample = true,
        LegacyRunStatus = "Created",
        CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
        PinnedPolicyPackIdsHashSha256 = [1, 2, 3, 4],
    };
}
