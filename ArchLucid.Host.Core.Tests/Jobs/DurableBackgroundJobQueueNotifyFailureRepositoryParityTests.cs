using ArchLucid.Application.Jobs;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Jobs;

/// <summary>
/// Mirrors SQL <c>MarkFailedTerminalAsync</c> running-only guard vs queued notify-failure terminal updates.
/// </summary>
[Trait("Category", "Unit")]
public sealed class DurableBackgroundJobQueueNotifyFailureRepositoryParityTests
{
    [Fact]
    public async Task EnqueueAsync_notify_failure_marks_pending_row_failed_when_running_only_terminal_is_no_op()
    {
        BackgroundJobRow row = new()
        {
            JobId = "job-pending-notify-fail",
            State = nameof(BackgroundJobState.Pending),
            RetryCount = 0,
            MaxRetries = 0,
            WorkUnitJson = "{}",
            CreatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<IBackgroundJobRepository> repository = new();
        repository
            .Setup(r => r.TryInsertPendingJobIfUnderCapacityAsync(It.IsAny<BackgroundJobRow>(), 5, It.IsAny<CancellationToken>()))
            .Callback<BackgroundJobRow, int, CancellationToken>((inserted, _, _) =>
            {
                row = new BackgroundJobRow
                {
                    JobId = inserted.JobId,
                    State = nameof(BackgroundJobState.Pending),
                    RetryCount = 0,
                    MaxRetries = 0,
                    WorkUnitJson = inserted.WorkUnitJson,
                    CreatedUtc = inserted.CreatedUtc,
                };
            })
            .ReturnsAsync(true);

        repository
            .Setup(r => r.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => row);

        repository
            .Setup(r => r.MarkFailedTerminalAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, int, CancellationToken>((_, error, retryCount, _) =>
            {
                if (!string.Equals(row.State, nameof(BackgroundJobState.Running), StringComparison.OrdinalIgnoreCase))
                    return;

                row = CloneRow(row, nameof(BackgroundJobState.Failed), error, retryCount);
            })
            .Returns(Task.CompletedTask);

        repository
            .Setup(r => r.MarkFailedTerminalFromQueuedStateAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, int, CancellationToken>((_, error, retryCount, _) =>
            {
                if (!string.Equals(row.State, nameof(BackgroundJobState.Pending), StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(row.State, nameof(BackgroundJobState.Running), StringComparison.OrdinalIgnoreCase))
                {
                    return;
                }

                row = CloneRow(row, nameof(BackgroundJobState.Failed), error, retryCount);
            })
            .Returns(Task.CompletedTask);

        Mock<IBackgroundJobQueueNotifySender> notifySender = new();
        notifySender
            .Setup(n => n.SendJobIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("queue unavailable"));

        DurableBackgroundJobQueue queue = new(
            repository.Object,
            notifySender.Object,
            Mock.Of<IBackgroundJobResultBlobAccessor>(),
            Options.Create(new BackgroundJobsOptions { MaxPendingJobs = 5 }));

        Func<Task> act = async () =>
            await queue.EnqueueAsync(
                new AnalysisReportDocxWorkUnit(
                    new AnalysisReportDocxJobPayload { RunId = "run-notify-fail" },
                    "report.docx",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
                cancellationToken: CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*queue unavailable*");

        row.State.Should().Be(nameof(BackgroundJobState.Failed));
        repository.Verify(
            r => r.MarkFailedTerminalFromQueuedStateAsync(
                row.JobId,
                It.Is<string>(message => message.Contains("Queue notification failed", StringComparison.Ordinal)),
                0,
                It.IsAny<CancellationToken>()),
            Times.Once);
        repository.Verify(
            r => r.MarkFailedTerminalAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static BackgroundJobRow CloneRow(BackgroundJobRow source, string state, string error, int retryCount) =>
        new()
        {
            JobId = source.JobId,
            WorkUnitJson = source.WorkUnitJson,
            State = state,
            CreatedUtc = source.CreatedUtc,
            StartedUtc = source.StartedUtc,
            CompletedUtc = DateTimeOffset.UtcNow,
            Error = error,
            FileName = source.FileName,
            ContentType = source.ContentType,
            RetryCount = retryCount,
            MaxRetries = source.MaxRetries,
            ResultBlobName = source.ResultBlobName,
        };
}
