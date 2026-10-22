using ArchLucid.Contracts.Common;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Runs;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class ReadyForCommitRunTests
{
    [Fact]
    public void TryIssueReadyForCommitRun_succeeds_only_from_ready_for_commit()
    {
        RunId runId = RunId.New();

        ArchitectureRunStatusTransitionTable.TryIssueReadyForCommitRun(
            ArchitectureRunStatus.ReadyForCommit,
            runId,
            out ReadyForCommitRun handle).Should().BeTrue();

        handle.RunId.Should().Be(runId);
        handle.FinalizeLifecycleEvent.Should().Be(ArchitectureRunStatusLifecycleEvent.CommitFinalized);
    }

    [Fact]
    public void TryIssueReadyForCommitRun_denies_created_status()
    {
        RunId runId = RunId.New();

        ArchitectureRunStatusTransitionTable.TryIssueReadyForCommitRun(
            ArchitectureRunStatus.Created,
            runId,
            out ReadyForCommitRun handle).Should().BeFalse();

        handle.Should().Be(default(ReadyForCommitRun));
    }
}
