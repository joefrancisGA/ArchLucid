using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
public sealed class InMemoryArchitectureIdentityAtomicUpdateTests
{
    private static ScopeContext Scope() => new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    [Fact]
    public async Task Concurrent_untitled_name_promotions_have_exactly_one_winner()
    {
        InMemoryArchitectureIdentityRepository repository = new();
        ScopeContext scope = Scope();
        ArchitectureIdentityRecord created = await repository.CreateAsync(
            scope, ArchitectureIdentityDisplayNameDefaults.UntitledArchitecture, null);

        const int attempts = 48;
        using ManualResetEventSlim gate = new(false);
        Task<bool>[] calls = Enumerable.Range(0, attempts)
            .Select(i => Task.Run(async () =>
            {
                gate.Wait();
                return await repository.TryUpdateDisplayNameWhenUntitledAsync(
                    scope, created.ArchitectureId, $"Architecture-{i}");
            }))
            .ToArray();
        gate.Set();

        bool[] results = await Task.WhenAll(calls);
        results.Count(result => result).Should().Be(1,
            "the SQL-equivalent conditional update must claim the untitled name once");

        ArchitectureIdentityRecord? stored = await repository.GetByIdAsync(scope, created.ArchitectureId);
        stored.Should().NotBeNull();
        stored!.DisplayName.Should().StartWith("Architecture-");
        (await repository.TryUpdateDisplayNameWhenUntitledAsync(
            scope, created.ArchitectureId, "late caller")).Should().BeFalse();
    }

    [Fact]
    public async Task Concurrent_unrelated_updates_preserve_both_fields()
    {
        InMemoryArchitectureIdentityRepository repository = new();
        ScopeContext scope = Scope();
        ArchitectureIdentityRecord created = await repository.CreateAsync(scope, "Current", "model-initial");

        for (int i = 0; i < 24; i++)
        {
            string modelId = $"model-{i}";
            string description = $"description-{i}";
            await Task.WhenAll(
                Task.Run(() => repository.UpdateCurrentModelAsync(scope, created.ArchitectureId, modelId)),
                Task.Run(() => repository.TryPatchAsync(
                    scope, created.ArchitectureId, false, null, true, description)));
            ArchitectureIdentityRecord? read = await repository.GetByIdAsync(scope, created.ArchitectureId);
            read.Should().NotBeNull();
            read!.CurrentModelId.Should().Be(modelId);
            read.Description.Should().Be(description);
        }
    }

    [Fact]
    public async Task Canceled_share_restriction_update_does_not_modify_the_row()
    {
        InMemoryArchitectureIdentityRepository repository = new();
        ScopeContext scope = Scope();
        ArchitectureIdentityRecord created = await repository.CreateAsync(scope, "Restricted", null);
        using CancellationTokenSource canceled = new();
        canceled.Cancel();

        Func<Task> act = () => repository.TrySetRestrictToSharesAsync(
            scope, created.ArchitectureId, true, canceled.Token);
        await act.Should().ThrowAsync<OperationCanceledException>();

        (await repository.GetByIdAsync(scope, created.ArchitectureId))!
            .RestrictToShares.Should().BeFalse();
    }

    [Fact]
    public async Task Atomic_updates_remain_scope_restricted_and_keep_returned_records_detached()
    {
        InMemoryArchitectureIdentityRepository repository = new();
        ScopeContext scope = Scope();
        ArchitectureIdentityRecord created = await repository.CreateAsync(scope, "Scoped", null);
        ScopeContext foreign = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
        };

        (await repository.TryPatchAsync(foreign, created.ArchitectureId, true, "Foreign", false, null))
            .Should().BeFalse();
        (await repository.TrySetArchivedAsync(foreign, created.ArchitectureId, true)).Should().BeFalse();
        (await repository.TrySetRestrictToSharesAsync(foreign, created.ArchitectureId, true)).Should().BeFalse();

        (await repository.TryPatchAsync(scope, created.ArchitectureId, true, "Owner", true, "ok"))
            .Should().BeTrue();
        ArchitectureIdentityRecord result = (await repository.GetByIdAsync(scope, created.ArchitectureId))!;
        result.DisplayName.Should().Be("Owner");
        result.Description.Should().Be("ok");
        result.DisplayName = "external edit";
        (await repository.GetByIdAsync(scope, created.ArchitectureId))!.DisplayName.Should().Be("Owner");
    }
}
