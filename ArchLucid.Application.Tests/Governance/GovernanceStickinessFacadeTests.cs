using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceStickinessFacadeTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetAssignedToMeFindingsCountAsync_returns_zero_when_actor_has_no_identities()
    {
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("api-user");
        actor.Setup(a => a.GetActorId()).Returns(string.Empty);
        actor.Setup(a => a.TryGetSubmitterMailbox()).Returns((string?)null);

        Mock<IArchitectureRiskRegisterService> riskRegister = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(actor: actor.Object, riskRegister: riskRegister.Object);

        int count = await sut.GetAssignedToMeFindingsCountAsync(projectId: null, CancellationToken.None);

        count.Should().Be(0);
        riskRegister.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task UpdateRecurrenceScheduleAsync_returns_not_found_when_schedule_is_out_of_scope()
    {
        Guid scheduleId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IArchitectureReviewRecurrenceScheduleRepository> schedules = new();
        schedules
            .Setup(r => r.GetByIdAsync(scheduleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ArchitectureReviewRecurrenceSchedule
                {
                    ScheduleId = scheduleId,
                    TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    CronExpression = "0 8 * * 1",
                    IsEnabled = true,
                });

        GovernanceStickinessFacade sut = CreateSut(recurrenceSchedules: schedules.Object);

        RecurrenceScheduleUpdateResult result = await sut.UpdateRecurrenceScheduleAsync(
            scheduleId,
            new UpdateArchitectureReviewRecurrenceScheduleRequest { Name = "updated" },
            CancellationToken.None);

        result.Outcome.Should().Be(RecurrenceScheduleUpdateOutcome.NotFound);
        result.Schedule.Should().BeNull();
    }

    [Fact]
    public async Task UpdateRecurrenceScheduleAsync_preserves_next_run_when_request_has_no_schedule_changes()
    {
        Guid scheduleId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        DateTime originalNextRun = new(2026, 9, 1, 8, 0, 0, DateTimeKind.Utc);

        ArchitectureReviewRecurrenceSchedule existing = new()
        {
            ScheduleId = scheduleId,
            TenantId = CallerScope.TenantId,
            WorkspaceId = CallerScope.WorkspaceId,
            ProjectId = CallerScope.ProjectId,
            CronExpression = "0 8 * * 1",
            IsEnabled = true,
            NextRunUtc = originalNextRun,
        };

        Mock<IArchitectureReviewRecurrenceScheduleRepository> schedules = new();
        schedules
            .Setup(r => r.GetByIdAsync(scheduleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        ArchitectureReviewRecurrenceSchedule? updated = null;
        schedules
            .Setup(r => r.UpdateAsync(It.IsAny<ArchitectureReviewRecurrenceSchedule>(), It.IsAny<CancellationToken>()))
            .Callback<ArchitectureReviewRecurrenceSchedule, CancellationToken>((schedule, _) => updated = schedule)
            .Returns(Task.CompletedTask);

        Mock<IArchitectureReviewRecurrenceNextRunCalculator> calculator = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(
            recurrenceSchedules: schedules.Object,
            recurrenceCalculator: calculator.Object);

        RecurrenceScheduleUpdateResult result = await sut.UpdateRecurrenceScheduleAsync(
            scheduleId,
            new UpdateArchitectureReviewRecurrenceScheduleRequest(),
            CancellationToken.None);

        result.Outcome.Should().Be(RecurrenceScheduleUpdateOutcome.Updated);
        updated.Should().NotBeNull();
        updated!.NextRunUtc.Should().Be(originalNextRun);
        calculator.VerifyNoOtherCalls();
    }

    [Fact]
    public void PreviewRecurrenceScheduleRuns_returns_invalid_for_unsupported_cron()
    {
        Mock<IArchitectureReviewRecurrenceNextRunCalculator> calculator = new();
        calculator.Setup(c => c.IsSupportedCronExpression("not-a-cron")).Returns(false);

        GovernanceStickinessFacade sut = CreateSut(recurrenceCalculator: calculator.Object);

        PreviewRecurrenceScheduleRunsResponse response = sut.PreviewRecurrenceScheduleRuns(
            new PreviewRecurrenceScheduleRunsRequest
            {
                CronExpression = "not-a-cron",
                Count = 3,
            });

        response.IsValid.Should().BeFalse();
        response.ValidationError.Should().Be(RecurrenceScheduleCronValidation.InvalidCronMessage);
    }

    [Fact]
    public void PreviewRecurrenceScheduleRuns_rejects_overlong_cron_expression()
    {
        Mock<IArchitectureReviewRecurrenceNextRunCalculator> calculator = new();
        GovernanceStickinessFacade sut = CreateSut(recurrenceCalculator: calculator.Object);
        string overlongCron = new string('0', RecurrenceScheduleValidation.CronExpressionMaxLength + 1);

        Action act = () => sut.PreviewRecurrenceScheduleRuns(
            new PreviewRecurrenceScheduleRunsRequest
            {
                CronExpression = overlongCron,
                Count = 3,
            });

        act.Should()
            .Throw<ArgumentException>()
            .WithMessage($"*at most {RecurrenceScheduleValidation.CronExpressionMaxLength}*");
        calculator.VerifyNoOtherCalls();
    }

    private static GovernanceStickinessFacade CreateSut(
        IActorContext? actor = null,
        IArchitectureRiskRegisterService? riskRegister = null,
        IArchitectureReviewRecurrenceScheduleRepository? recurrenceSchedules = null,
        IArchitectureReviewRecurrenceNextRunCalculator? recurrenceCalculator = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        return new GovernanceStickinessFacade(
            scope.Object,
            actor ?? new Mock<IActorContext>().Object,
            new Mock<IFindingDispositionService>().Object,
            new Mock<IRiskExceptionService>().Object,
            riskRegister ?? new Mock<IArchitectureRiskRegisterService>().Object,
            new Mock<IArchitectureDecisionRegisterService>().Object,
            recurrenceSchedules ?? new Mock<IArchitectureReviewRecurrenceScheduleRepository>().Object,
            recurrenceCalculator ?? new Mock<IArchitectureReviewRecurrenceNextRunCalculator>().Object,
            new Mock<IRunRepository>().Object,
            new Mock<ArchLucid.Application.Findings.IFindingMergeConflictResolutionService>().Object,
            new Mock<IGovernanceDigestDecisionNeededComposer>().Object,
            new Mock<IReviewsAwaitingActionQueryService>().Object,
            new Mock<IRealizedValueAttestationService>().Object,
            new Mock<IAuditService>().Object,
            new Mock<IFindingInspectReadRepository>().Object);
    }
}
