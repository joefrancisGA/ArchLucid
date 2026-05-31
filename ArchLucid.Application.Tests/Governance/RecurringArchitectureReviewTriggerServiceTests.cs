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
public sealed class RecurringArchitectureReviewTriggerServiceTests
{
    [Fact]
    public async Task TriggerScheduleAsync_persists_checkpoint_before_execute()
    {
        Guid scheduleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid sourceRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid newRunId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        DateTime nextRun = new(2026, 6, 7, 8, 0, 0, DateTimeKind.Utc);

        ArchitectureReviewRecurrenceSchedule schedule = new()
        {
            ScheduleId = scheduleId,
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            SourceRunId = sourceRunId,
            CronExpression = "0 8 * * 1",
            NextRunUtc = new DateTime(2026, 5, 31, 8, 0, 0, DateTimeKind.Utc),
        };

        List<string> callOrder = [];
        Mock<IArchitectureReviewRecurrenceScheduleRepository> schedules = new();
        schedules
            .Setup(repo => repo.UpdateAsync(It.IsAny<ArchitectureReviewRecurrenceSchedule>(), It.IsAny<CancellationToken>()))
            .Callback(() => callOrder.Add("update"))
            .Returns(Task.CompletedTask);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(repo => repo.GetByIdAsync(It.IsAny<ScopeContext>(), sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new RunRecord
                {
                    RunId = sourceRunId,
                    ArchitectureRequestId = "req-1",
                });

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(repo => repo.GetByIdAsync("req-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest { RequestId = "req-1" });

        Mock<IArchitectureRunCreateOrchestrator> create = new();
        create
            .Setup(o => o.CreateRunAsync(It.IsAny<ArchitectureRequest>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new CreateRunResult
                {
                    Run = new ArchitectureRun { RunId = newRunId.ToString("N") },
                })
            .Callback(() => callOrder.Add("create"));

        Mock<IArchitectureRunExecuteOrchestrator> execute = new();
        execute
            .Setup(o => o.ExecuteRunAsync(newRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExecuteRunResult { RunId = newRunId.ToString("N") })
            .Callback(() => callOrder.Add("execute"));

        Mock<IScanScheduleCalculator> calculator = new();
        calculator
            .Setup(c => c.ComputeNextRunUtc(schedule.CronExpression, It.IsAny<DateTime>()))
            .Returns(nextRun);

        RecurringArchitectureReviewTriggerService sut = new(
            schedules.Object,
            runs.Object,
            requests.Object,
            create.Object,
            execute.Object,
            calculator.Object,
            Mock.Of<IAuditService>(),
            NullLogger<RecurringArchitectureReviewTriggerService>.Instance);

        await sut.TriggerScheduleAsync(schedule, CancellationToken.None);

        callOrder.Should().Equal("create", "update", "execute");
        schedule.LastTriggeredRunId.Should().Be(newRunId);
        schedule.NextRunUtc.Should().Be(nextRun);
    }
}
