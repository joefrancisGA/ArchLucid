using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CommitRunIdempotencyCoordinatorTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private const string RunId = "11111111-1111-1111-1111-111111111111";

    private static CommitRunIdempotencyState CreateState(CommitRunRequest? request = null) =>
        CommitRunIdempotencyState.Create(Scope, RunId, request, "key-1");

    /// <summary>Records the commit delegate invocation count so replay paths can assert it ran exactly once.</summary>
    private sealed class CommitSpy
    {
        public int Invocations
        {
            get;
            private set;
        }

        public Task<CommitRunResult> CommitAsync(CancellationToken cancellationToken)
        {
            Invocations++;

            return Task.FromResult(new CommitRunResult());
        }
    }

    [Fact]
    public async Task CommitAsync_without_a_key_commits_once_and_never_touches_the_repository()
    {
        Mock<ICommitRunIdempotencyRepository> repository = new(MockBehavior.Strict);
        CommitSpy commit = new();
        CommitRunIdempotencyCoordinator coordinator = new(repository.Object);

        CommitRunIdempotencyOutcome outcome = await coordinator.CommitAsync(null, commit.CommitAsync);

        outcome.IdempotentReplay.Should().BeFalse();
        outcome.Result.Should().NotBeNull();
        commit.Invocations.Should().Be(1);
        repository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CommitAsync_with_a_first_use_key_records_the_commit_without_flagging_a_replay()
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

        CommitRunIdempotencyOutcome outcome = await coordinator.CommitAsync(CreateState(), commit.CommitAsync);

        outcome.IdempotentReplay.Should().BeFalse();
        commit.Invocations.Should().Be(1);
    }

    [Fact]
    public async Task CommitAsync_flags_a_replay_when_the_key_already_recorded_the_same_body()
    {
        CommitRunIdempotencyState state = CreateState();

        Mock<ICommitRunIdempotencyRepository> repository = new();
        repository
            .Setup(r => r.TryGetAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<byte[]>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CommitRunIdempotencyLookup { RequestFingerprint = state.RequestFingerprint });
        repository
            .Setup(r => r.TryInsertAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<byte[]>(),
                It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        CommitSpy commit = new();
        CommitRunIdempotencyCoordinator coordinator = new(repository.Object);

        CommitRunIdempotencyOutcome outcome = await coordinator.CommitAsync(state, commit.CommitAsync);

        outcome.IdempotentReplay.Should().BeTrue();
    }

    /// <summary>A losing insert is a concurrent request that recorded the same key first, not a failure.</summary>
    [Fact]
    public async Task CommitAsync_flags_a_replay_when_a_concurrent_request_records_the_key_first()
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
            .ReturnsAsync(false);

        CommitSpy commit = new();
        CommitRunIdempotencyCoordinator coordinator = new(repository.Object);

        CommitRunIdempotencyOutcome outcome = await coordinator.CommitAsync(CreateState(), commit.CommitAsync);

        outcome.IdempotentReplay.Should().BeTrue();
        commit.Invocations.Should().Be(1);
    }

    [Fact]
    public async Task CommitAsync_rejects_a_key_reused_with_a_different_body_before_committing()
    {
        Mock<ICommitRunIdempotencyRepository> repository = new();
        repository
            .Setup(r => r.TryGetAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<byte[]>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CommitRunIdempotencyLookup { RequestFingerprint = [1, 2, 3] });

        CommitSpy commit = new();
        CommitRunIdempotencyCoordinator coordinator = new(repository.Object);

        Func<Task> act = () => coordinator.CommitAsync(CreateState(), commit.CommitAsync);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*different request payload*");
        commit.Invocations.Should().Be(0);
    }

    [Fact]
    public async Task CommitAsync_rejects_a_null_commit_delegate()
    {
        CommitRunIdempotencyCoordinator coordinator = new(Mock.Of<ICommitRunIdempotencyRepository>());

        Func<Task> act = () => coordinator.CommitAsync(null, null!);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_rejects_a_null_repository()
    {
        Action construct = () => _ = new CommitRunIdempotencyCoordinator(null!);

        construct.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Create_normalizes_the_run_key_and_fingerprints_the_body()
    {
        CommitRunIdempotencyState state = CommitRunIdempotencyState.Create(
            Scope,
            "11111111-1111-1111-1111-111111111111",
            new CommitRunRequest(),
            "key-1");

        state.CanonicalRunKey.Should().Be("11111111111111111111111111111111");
        state.TenantId.Should().Be(Scope.TenantId);
        state.IdempotencyKeyHash.Should().NotBeEmpty();
        state.RequestFingerprint.Should().NotBeEmpty();
    }

    /// <summary>A null body must fingerprint as the default request so an omitted body replays consistently.</summary>
    [Fact]
    public void Create_fingerprints_a_null_body_as_the_default_request()
    {
        CommitRunIdempotencyState withNullBody = CommitRunIdempotencyState.Create(Scope, RunId, null, "key-1");
        CommitRunIdempotencyState withDefaultBody =
            CommitRunIdempotencyState.Create(Scope, RunId, new CommitRunRequest(), "key-1");

        withNullBody.RequestFingerprint.Should().Equal(withDefaultBody.RequestFingerprint);
    }

    [Fact]
    public void Create_rejects_a_null_scope()
    {
        Action create = () => CommitRunIdempotencyState.Create(null!, RunId, null, "key-1");

        create.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Create_rejects_a_blank_run_id()
    {
        Action create = () => CommitRunIdempotencyState.Create(Scope, "  ", null, "key-1");

        create.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_rejects_a_blank_idempotency_key()
    {
        Action create = () => CommitRunIdempotencyState.Create(Scope, RunId, null, "  ");

        create.Should().Throw<ArgumentException>();
    }
}
