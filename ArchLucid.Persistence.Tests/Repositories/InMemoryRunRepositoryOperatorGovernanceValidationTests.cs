using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
public sealed class InMemoryRunRepositoryOperatorGovernanceValidationTests
{
    [Theory]
    [InlineData("", "reviewer")]
    [InlineData("   ", "reviewer")]
    [InlineData("Approved", "")]
    [InlineData("Approved", "   ")]
    public async Task Invalid_disposition_is_rejected_without_mutating_the_run(
        string decision, string actorUserId)
    {
        InMemoryRunRepository repository = new();
        ScopeContext scope = NewScope();
        RunRecord record = NewRun(scope);
        await repository.SaveAsync(record, CancellationToken.None);

        Func<Task> update = () => repository.TrySetOperatorGovernanceDispositionAsync(
            scope, record.RunId, decision, "reason", actorUserId, DateTime.UtcNow, CancellationToken.None);

        await update.Should().ThrowAsync<ArgumentException>();
        RunRecord stored = (await repository.GetByIdAsync(scope, record.RunId, CancellationToken.None))!;
        stored.OperatorGovernanceDecision.Should().BeNull();
        stored.OperatorGovernanceDecisionByUserId.Should().BeNull();
        stored.OperatorGovernanceDecisionRationale.Should().BeNull();
    }

    [Fact]
    public async Task Invalid_run_id_is_rejected_before_any_persistence_access()
    {
        InMemoryRunRepository repository = new();
        ScopeContext scope = NewScope();

        Func<Task> update = () => repository.TrySetOperatorGovernanceDispositionAsync(
            scope, Guid.Empty, "Approved", "reason", "reviewer", DateTime.UtcNow, CancellationToken.None);
        await update.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task Out_of_scope_or_canceled_disposition_cannot_modify_existing_run()
    {
        InMemoryRunRepository repository = new();
        ScopeContext owner = NewScope();
        RunRecord run = NewRun(owner);
        await repository.SaveAsync(run, CancellationToken.None);

        ScopeContext foreign = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = owner.WorkspaceId,
            ProjectId = owner.ProjectId,
        };

        (await repository.TrySetOperatorGovernanceDispositionAsync(
            foreign, run.RunId, "Approved", null, "outsider", DateTime.UtcNow, CancellationToken.None))
            .Should().BeFalse();

        using CancellationTokenSource canceled = new();
        canceled.Cancel();
        Func<Task> update = () => repository.TrySetOperatorGovernanceDispositionAsync(
            owner, run.RunId, "Approved", null, "reviewer", DateTime.UtcNow, canceled.Token);
        await update.Should().ThrowAsync<OperationCanceledException>();

        run.OperatorGovernanceDecision.Should().BeNull();
    }

    [Fact]
    public async Task Competing_governance_updates_do_not_mix_decision_actor_and_rationale()
    {
        InMemoryRunRepository repository = new();
        ScopeContext scope = NewScope();
        RunRecord run = NewRun(scope);
        await repository.SaveAsync(run, CancellationToken.None);

        Task<bool>[] updates = Enumerable.Range(0, 32)
            .Select(i => Task.Run(() => repository.TrySetOperatorGovernanceDispositionAsync(
                scope, run.RunId, $"Decision-{i}", $"Rationale-{i}",
                $"Actor-{i}", DateTime.UnixEpoch.AddSeconds(i), CancellationToken.None)))
            .ToArray();

        bool[] outcomes = await Task.WhenAll(updates);
        outcomes.Should().OnlyContain(success => success);

        RunRecord final = (await repository.GetByIdAsync(scope, run.RunId, CancellationToken.None))!;
        int selected = int.Parse(final.OperatorGovernanceDecision!["Decision-".Length..]);
        final.OperatorGovernanceDecisionByUserId.Should().Be($"Actor-{selected}");
        final.OperatorGovernanceDecisionRationale.Should().Be($"Rationale-{selected}");
        final.OperatorGovernanceDecisionUtc.Should().Be(DateTime.UnixEpoch.AddSeconds(selected));
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
        ProjectId = "aspects-governance",
        Description = "Disposition test",
        CreatedUtc = DateTime.UtcNow,
        IsSample = true,
    };
}
