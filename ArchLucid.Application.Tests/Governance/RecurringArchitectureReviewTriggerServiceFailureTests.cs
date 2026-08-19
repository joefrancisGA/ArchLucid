using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class RecurringArchitectureReviewTriggerServiceFailureTests
{
    [Fact]
    public async Task TriggerScheduleAsync_on_execute_failure_increments_health_and_auto_disables_at_five()
    {
        Guid scheduleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid sourceRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid newRunId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        ArchitectureReviewRecurrenceSchedule schedule = new()
        {
            ScheduleId = scheduleId,
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            SourceRunId = sourceRunId,
            CronExpression = "0 8 * * 1",
            ConsecutiveFailureCount = 4,
        };

        Mock<IArchitectureReviewRecurrenceScheduleRepository> schedules = new();
        schedules
            .Setup(repo => repo.UpdateAsync(It.IsAny<ArchitectureReviewRecurrenceSchedule>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(repo => repo.GetByIdAsync(It.IsAny<ScopeContext>(), sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = sourceRunId, ArchitectureRequestId = "req-1" });

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(repo => repo.GetByIdAsync("req-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest { RequestId = "req-1" });

        Mock<IArchitectureRunCreateOrchestrator> create = new();
        create
            .Setup(o => o.CreateRunAsync(It.IsAny<ArchitectureRequest>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CreateRunResult { Run = new ArchitectureRun { RunId = newRunId.ToString("N") } });

        Mock<IArchitectureRunExecuteOrchestrator> execute = new();
        execute
            .Setup(o => o.ExecuteRunAsync(newRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("execute failed"));

        Mock<IScanScheduleCalculator> calculator = new();
        calculator
            .Setup(c => c.ComputeNextRunUtc(It.IsAny<string>(), It.IsAny<DateTime>()))
            .Returns(new DateTime(2026, 6, 14, 8, 0, 0, DateTimeKind.Utc));

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        RecurringArchitectureReviewTriggerService sut = new(
            schedules.Object,
            runs.Object,
            requests.Object,
            create.Object,
            execute.Object,
            calculator.Object,
            Mock.Of<IRecurrenceCompletionNotificationService>(),
            audit.Object,
            NullLogger<RecurringArchitectureReviewTriggerService>.Instance);

        Func<Task> act = () => sut.TriggerScheduleAsync(schedule, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();

        schedule.LastRunStatus.Should().Be(RecurrenceRunStatuses.Failed);
        schedule.ConsecutiveFailureCount.Should().Be(5);
        schedule.IsEnabled.Should().BeFalse();
        schedule.LastErrorMessage.Should().Contain("execute failed");

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ArchitectureReviewRecurrenceAutoDisabled),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
