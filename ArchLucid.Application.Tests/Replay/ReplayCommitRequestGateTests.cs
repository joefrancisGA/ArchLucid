using ArchLucid.Application.Replay;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Replay;

[Trait("Suite", "Application")]
[Trait("Category", "Unit")]
public sealed class ReplayCommitRequestGateTests
{
    [Fact]
    public void ShouldSkipCommit_is_true_when_commit_was_not_requested()
    {
        ReplayCommitRequestGate.ShouldSkipCommit(commitReplayRequested: false).Should().BeTrue();
    }

    [Fact]
    public void ShouldSkipCommit_is_false_when_commit_was_requested()
    {
        ReplayCommitRequestGate.ShouldSkipCommit(commitReplayRequested: true).Should().BeFalse();
    }
}
