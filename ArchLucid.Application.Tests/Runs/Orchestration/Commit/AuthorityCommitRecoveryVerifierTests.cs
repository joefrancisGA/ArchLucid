using ArchLucid.Application.Runs.Orchestration.Commit;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration.Commit;

/// <summary>
///     Wave-13 #130 plus TB-310 pre-sealed anchors: ReadyForCommit with a golden id is first
///     finalize, not an unrecoverable torn commit.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityCommitRecoveryVerifierTests
{
    private const string RunIdLabel = "f928428c8ea044d6bca1bc23860b8dfd";

    [Fact]
    public void EnsureRecoverableOrThrow_ready_for_commit_with_pre_sealed_golden_id_does_not_throw()
    {
        Guid goldenId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        ArchitectureRun run = CreateRun(ArchitectureRunStatus.ReadyForCommit, goldenId);
        RunRecord header = CreateHeader(goldenId, includeSnapshots: true);

        Action act = () => AuthorityCommitRecoveryVerifier.EnsureRecoverableOrThrow(run, header, RunIdLabel);

        act.Should().NotThrow();
    }

    [Fact]
    public void ShouldVerifySealedInventory_is_false_for_ready_for_commit_pre_seal()
    {
        ArchitectureRun run = CreateRun(
            ArchitectureRunStatus.ReadyForCommit,
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));

        AuthorityCommitRecoveryVerifier.ShouldVerifySealedInventory(run).Should().BeFalse();
    }

    [Fact]
    public void ShouldVerifySealedInventory_is_true_for_committed_run_with_golden_id()
    {
        ArchitectureRun run = CreateRun(
            ArchitectureRunStatus.Committed,
            Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"));

        AuthorityCommitRecoveryVerifier.ShouldVerifySealedInventory(run).Should().BeTrue();
    }

    [Fact]
    public void ShouldVerifySealedInventory_is_false_when_golden_id_is_missing()
    {
        ArchitectureRun run = CreateRun(ArchitectureRunStatus.Committed, goldenManifestId: null);

        AuthorityCommitRecoveryVerifier.ShouldVerifySealedInventory(run).Should().BeFalse();
    }

    [Fact]
    public void EnsureRecoverableOrThrow_failed_status_with_golden_id_is_blocked()
    {
        Guid goldenId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        ArchitectureRun run = CreateRun(ArchitectureRunStatus.Failed, goldenId);
        RunRecord header = CreateHeader(goldenId, includeSnapshots: true);

        Action act = () => AuthorityCommitRecoveryVerifier.EnsureRecoverableOrThrow(run, header, RunIdLabel);

        act.Should()
            .Throw<ConflictException>()
            .WithMessage("*golden manifest id is set but run status is Failed*");
    }

    [Fact]
    public void EnsureRecoverableOrThrow_waiting_for_results_with_golden_id_is_blocked()
    {
        Guid goldenId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        ArchitectureRun run = CreateRun(ArchitectureRunStatus.WaitingForResults, goldenId);
        RunRecord header = CreateHeader(goldenId, includeSnapshots: true);

        Action act = () => AuthorityCommitRecoveryVerifier.EnsureRecoverableOrThrow(run, header, RunIdLabel);

        act.Should()
            .Throw<ConflictException>()
            .WithMessage("*golden manifest id is set but run status is WaitingForResults*");
    }

    [Fact]
    public void EnsureRecoverableOrThrow_ready_for_commit_with_golden_id_and_missing_snapshots_is_blocked()
    {
        Guid goldenId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        ArchitectureRun run = CreateRun(ArchitectureRunStatus.ReadyForCommit, goldenId);
        RunRecord header = CreateHeader(goldenId, includeSnapshots: false);

        Action act = () => AuthorityCommitRecoveryVerifier.EnsureRecoverableOrThrow(run, header, RunIdLabel);

        act.Should()
            .Throw<ConflictException>()
            .WithMessage("*golden manifest id is set but pipeline snapshot ids are incomplete*");
    }

    [Fact]
    public void EnsureRecoverableOrThrow_divergent_golden_ids_are_blocked()
    {
        ArchitectureRun run = CreateRun(
            ArchitectureRunStatus.ReadyForCommit,
            Guid.Parse("11111111-1111-1111-1111-111111111111"));
        RunRecord header = CreateHeader(
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            includeSnapshots: true);

        Action act = () => AuthorityCommitRecoveryVerifier.EnsureRecoverableOrThrow(run, header, RunIdLabel);

        act.Should()
            .Throw<ConflictException>()
            .WithMessage("*run header and architecture run golden manifest ids diverge*");
    }

    [Fact]
    public void EnsureRecoverableOrThrow_committed_with_matching_golden_id_does_not_throw()
    {
        Guid goldenId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        ArchitectureRun run = CreateRun(ArchitectureRunStatus.Committed, goldenId);
        RunRecord header = CreateHeader(goldenId, includeSnapshots: true);

        Action act = () => AuthorityCommitRecoveryVerifier.EnsureRecoverableOrThrow(run, header, RunIdLabel);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureRecoverableOrThrow_null_run_throws()
    {
        RunRecord header = CreateHeader(Guid.NewGuid(), includeSnapshots: true);

        Action act = () => AuthorityCommitRecoveryVerifier.EnsureRecoverableOrThrow(null!, header, RunIdLabel);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void ShouldVerifySealedInventory_null_run_throws()
    {
        Action act = () => AuthorityCommitRecoveryVerifier.ShouldVerifySealedInventory(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    private static ArchitectureRun CreateRun(ArchitectureRunStatus status, Guid? goldenManifestId)
    {
        return new ArchitectureRun
        {
            RunId = RunIdLabel,
            RequestId = "req-recovery",
            Status = status,
            GoldenManifestId = goldenManifestId,
        };
    }

    private static RunRecord CreateHeader(Guid goldenManifestId, bool includeSnapshots)
    {
        return new RunRecord
        {
            GoldenManifestId = goldenManifestId,
            ContextSnapshotId = includeSnapshots ? Guid.Parse("44444444-4444-4444-4444-444444444444") : null,
            GraphSnapshotId = includeSnapshots ? Guid.Parse("55555555-5555-5555-5555-555555555555") : null,
            FindingsSnapshotId = includeSnapshots ? Guid.Parse("66666666-6666-6666-6666-666666666666") : null,
        };
    }
}
