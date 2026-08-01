using ArchLucid.Cli.Commands;

using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunCommitPollerTests
{
    [Fact]
    public async Task PollForCommittableStatusAsync_rejects_non_positive_poll_interval()
    {
        Func<Task> act = () => ArchitectureRunCommitPoller.PollForCommittableStatusAsync(
            _ => Task.FromResult<ArchitectureRunStatus?>(ArchitectureRunStatus.Committed),
            TimeSpan.FromSeconds(1),
            TimeSpan.Zero,
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentOutOfRangeException>().WithParameterName("pollInterval");
    }

    [Fact]
    public async Task PollForCommittableStatusAsync_returns_immediately_when_committed()
    {
        int calls = 0;

        ArchitectureRunStatus result = await ArchitectureRunCommitPoller.PollForCommittableStatusAsync(
            _ =>
            {
                calls++;

                return Task.FromResult<ArchitectureRunStatus?>(ArchitectureRunStatus.Committed);
            },
            TimeSpan.FromSeconds(3),
            TimeSpan.FromMilliseconds(25),
            CancellationToken.None);

        result.Should().Be(ArchitectureRunStatus.Committed);
        calls.Should().Be(1);
    }

    [Fact]
    public async Task PollForCommittableStatusAsync_WhenFailed_ReturnsImmediately()
    {
        ArchitectureRunStatus result = await ArchitectureRunCommitPoller.PollForCommittableStatusAsync(
            _ => Task.FromResult<ArchitectureRunStatus?>(ArchitectureRunStatus.Failed),
            TimeSpan.FromSeconds(5),
            TimeSpan.FromMilliseconds(20),
            CancellationToken.None);

        result.Should().Be(ArchitectureRunStatus.Failed);
    }

    [Fact]
    public async Task
        PollForCommittableStatusAsync_WhenStatusNeverReachesReadyForCommit_ReturnsLastObservedAfterDeadline()
    {
        int callCount = 0;

        ArchitectureRunStatus result = await ArchitectureRunCommitPoller.PollForCommittableStatusAsync(
            _ =>
            {
                callCount++;
                return Task.FromResult<ArchitectureRunStatus?>(ArchitectureRunStatus.WaitingForResults);
            },
            TimeSpan.FromSeconds(2),
            TimeSpan.FromMilliseconds(40),
            CancellationToken.None);

        result.Should().Be(ArchitectureRunStatus.WaitingForResults);
        callCount.Should().BeGreaterThan(1, "the polling loop must iterate before giving up");
    }

    [Fact]
    public async Task PollForCommittableStatusAsync_ReturnsAsSoonAsStatusReachesReadyForCommit()
    {
        int callCount = 0;

        ArchitectureRunStatus result = await ArchitectureRunCommitPoller.PollForCommittableStatusAsync(
            _ =>
            {
                callCount++;
                ArchitectureRunStatus status = callCount switch
                {
                    1 => ArchitectureRunStatus.Created,
                    2 => ArchitectureRunStatus.WaitingForResults,
                    _ => ArchitectureRunStatus.ReadyForCommit
                };
                return Task.FromResult<ArchitectureRunStatus?>(status);
            },
            TimeSpan.FromSeconds(5),
            TimeSpan.FromMilliseconds(20),
            CancellationToken.None);

        result.Should().Be(ArchitectureRunStatus.ReadyForCommit);
        callCount.Should().Be(3);
    }

    [Fact]
    public async Task PollForCommittableStatusAsync_NullProbeResults_DoNotShortCircuitDeadline()
    {
        ArchitectureRunStatus result = await ArchitectureRunCommitPoller.PollForCommittableStatusAsync(
            _ => Task.FromResult<ArchitectureRunStatus?>(null),
            TimeSpan.FromMilliseconds(120),
            TimeSpan.FromMilliseconds(30),
            CancellationToken.None);

        result.Should().Be(ArchitectureRunStatus.Created);
    }

    [Fact]
    public void PollForCommittableStatusAsync_RejectsNonPositiveDeadline()
    {
        Func<Task> act = () => ArchitectureRunCommitPoller.PollForCommittableStatusAsync(
            _ => Task.FromResult<ArchitectureRunStatus?>(ArchitectureRunStatus.Committed),
            TimeSpan.Zero,
            TimeSpan.FromMilliseconds(10),
            CancellationToken.None);

        act.Should().ThrowAsync<ArgumentOutOfRangeException>();
    }
}
