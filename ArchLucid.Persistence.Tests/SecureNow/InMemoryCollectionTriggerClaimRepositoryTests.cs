using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.SecureNow;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.SecureNow;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class InMemoryCollectionTriggerClaimRepositoryTests
{
    [Fact]
    public async Task TryReserveAsync_first_caller_acquires_and_second_reuses_run_id()
    {
        InMemoryCollectionTriggerClaimRepository repository = new();
        ProjectScopeKey scope = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        Guid firstRunId = Guid.NewGuid();
        Guid secondRunId = Guid.NewGuid();

        (bool firstAcquired, Guid firstStored, byte firstState) =
            await repository.TryReserveAsync(scope, "idem-1", firstRunId);
        (bool secondAcquired, Guid secondStored, byte secondState) =
            await repository.TryReserveAsync(scope, "idem-1", secondRunId);

        firstAcquired.Should().BeTrue();
        firstStored.Should().Be(firstRunId);
        firstState.Should().Be(0);
        secondAcquired.Should().BeFalse();
        secondStored.Should().Be(firstRunId);
        secondState.Should().Be(0);
    }

    [Fact]
    public async Task ReconcilePersistedRunAsync_marks_matching_pending_claim_scheduled()
    {
        InMemoryCollectionTriggerClaimRepository repository = new();
        ProjectScopeKey scope = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        Guid runId = Guid.NewGuid();

        await repository.TryReserveAsync(scope, "idem-2", runId);
        bool reconciled = await repository.ReconcilePersistedRunAsync(scope, "idem-2", runId);

        reconciled.Should().BeTrue();
        (_, _, byte state) = await repository.TryReserveAsync(scope, "idem-2", Guid.NewGuid());
        state.Should().Be(1);
    }

    [Fact]
    public async Task TryReserveAsync_rejects_empty_run_id_and_oversized_key()
    {
        InMemoryCollectionTriggerClaimRepository repository = new();
        ProjectScopeKey scope = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        Func<Task> emptyRun = () => repository.TryReserveAsync(scope, "idem-3", Guid.Empty);
        Func<Task> oversized = () => repository.TryReserveAsync(scope, new string('k', 257), Guid.NewGuid());

        await emptyRun.Should().ThrowAsync<ArgumentException>();
        await oversized.Should().ThrowAsync<ArgumentOutOfRangeException>();
    }

    [Fact]
    public async Task ReconcilePersistedRunAsync_returns_false_when_missing_or_already_scheduled()
    {
        InMemoryCollectionTriggerClaimRepository repository = new();
        ProjectScopeKey scope = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        Guid runId = Guid.NewGuid();

        (await repository.ReconcilePersistedRunAsync(scope, "missing", runId)).Should().BeFalse();
        await repository.TryReserveAsync(scope, "idem-4", runId);
        (await repository.ReconcilePersistedRunAsync(scope, "idem-4", Guid.NewGuid())).Should().BeFalse();
        (await repository.ReconcilePersistedRunAsync(scope, "idem-4", runId)).Should().BeTrue();
        (await repository.ReconcilePersistedRunAsync(scope, "idem-4", runId)).Should().BeFalse();
    }
}
