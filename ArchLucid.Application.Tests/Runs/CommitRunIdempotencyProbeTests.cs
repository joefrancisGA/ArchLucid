using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

/// <summary>
/// ABQ-27 probes: double-submit, cancel-then-retry, and overlapping commit keys.
/// Documents the current <see cref="CommitRunIdempotencyCoordinator"/> contract.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CommitRunIdempotencyProbeTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private const string RunId = "11111111-1111-1111-1111-111111111111";

    private static CommitRunIdempotencyState CreateState() =>
        CommitRunIdempotencyState.Create(Scope, RunId, new CommitRunRequest(), "key-1");

    private sealed class CommitSpy
    {
        public int Invocations
        {
            get;
            private set;
        }

        public Exception? ThrowOnInvoke
        {
            get;
            set;
        }

        public Task<CommitRunResult> CommitAsync(CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            Invocations++;

            if (ThrowOnInvoke is not null)
            {
                throw ThrowOnInvoke;
            }

            return Task.FromResult(new CommitRunResult());
        }
    }

    [Fact]
    public async Task Double_submit_same_key_flags_replay_on_the_second_call()
    {
        CommitRunIdempotencyState state = CreateState();
        Mock<ICommitRunIdempotencyRepository> repository = new();
        repository
            .SetupSequence(r => r.TryGetAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<byte[]>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((CommitRunIdempotencyLookup?)null)
            .ReturnsAsync(new CommitRunIdempotencyLookup { RequestFingerprint = state.RequestFingerprint });
        repository
            .Setup(r => r.TryInsertAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<byte[]>(),
                It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        CommitSpy commit = new();
        CommitRunIdempotencyCoordinator coordinator = new(repository.Object);

        CommitRunIdempotencyOutcome first = await coordinator.CommitAsync(state, commit.CommitAsync);
        CommitRunIdempotencyOutcome second = await coordinator.CommitAsync(state, commit.CommitAsync);

        first.IdempotentReplay.Should().BeFalse();
        second.IdempotentReplay.Should().BeTrue();
        commit.Invocations.Should().Be(1, "replay must not re-enter persist");
        repository.Verify(
            r => r.TryInsertAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<byte[]>(),
                It.IsAny<byte[]>(), It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task Cancel_mid_commit_does_not_record_the_idempotency_key()
    {
        Mock<ICommitRunIdempotencyRepository> repository = new();
        repository
            .Setup(r => r.TryGetAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<byte[]>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((CommitRunIdempotencyLookup?)null);

        CommitSpy commit = new();
        using CancellationTokenSource cts = new();
        cts.Cancel();
        CommitRunIdempotencyCoordinator coordinator = new(repository.Object);

        Func<Task> act = () => coordinator.CommitAsync(CreateState(), commit.CommitAsync, cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
        commit.Invocations.Should().Be(0);
        repository.Verify(
            r => r.TryInsertAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<byte[]>(),
                It.IsAny<byte[]>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Cancel_then_retry_records_on_the_successful_attempt()
    {
        Mock<ICommitRunIdempotencyRepository> repository = new();
        repository
            .Setup(r => r.TryGetAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<byte[]>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((CommitRunIdempotencyLookup?)null);
        repository
            .Setup(r => r.TryInsertAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<byte[]>(),
                It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        CommitSpy commit = new();
        CommitRunIdempotencyCoordinator coordinator = new(repository.Object);
        using CancellationTokenSource cts = new();
        cts.Cancel();

        Func<Task> cancelled = () => coordinator.CommitAsync(CreateState(), commit.CommitAsync, cts.Token);
        await cancelled.Should().ThrowAsync<OperationCanceledException>();

        CommitRunIdempotencyOutcome retry = await coordinator.CommitAsync(CreateState(), commit.CommitAsync);

        retry.IdempotentReplay.Should().BeFalse();
        commit.Invocations.Should().Be(1);
        repository.Verify(
            r => r.TryInsertAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<byte[]>(),
                It.IsAny<byte[]>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Overlapping_commits_first_insert_wins()
    {
        Mock<ICommitRunIdempotencyRepository> repository = new();
        repository
            .Setup(r => r.TryGetAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<byte[]>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((CommitRunIdempotencyLookup?)null);
        repository
            .SetupSequence(r => r.TryInsertAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<byte[]>(),
                It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true)
            .ReturnsAsync(false);

        CommitSpy first = new();
        CommitSpy second = new();
        CommitRunIdempotencyCoordinator coordinator = new(repository.Object);

        CommitRunIdempotencyOutcome winner = await coordinator.CommitAsync(CreateState(), first.CommitAsync);
        CommitRunIdempotencyOutcome loser = await coordinator.CommitAsync(CreateState(), second.CommitAsync);

        winner.IdempotentReplay.Should().BeFalse();
        loser.IdempotentReplay.Should().BeTrue();
        (first.Invocations + second.Invocations).Should().Be(2);
    }
}
