using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Governance;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class InMemoryArchitectureReviewRecurrenceScheduleRepositoryCoverageTests
{
    [Fact]
    public async Task Repository_round_trips_create_update_list_due_and_scope_queries()
    {
        InMemoryArchitectureReviewRecurrenceScheduleRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid scheduleId = Guid.NewGuid();
        DateTime dueUtc = new(2026, 7, 10, 8, 0, 0, DateTimeKind.Utc);

        ArchitectureReviewRecurrenceSchedule schedule = new()
        {
            ScheduleId = scheduleId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            SourceRunId = Guid.NewGuid(),
            Name = "Weekly review",
            IsEnabled = true,
            NextRunUtc = dueUtc,
            CreatedUtc = dueUtc.AddDays(-1),
        };

        await sut.CreateAsync(schedule, CancellationToken.None);

        ArchitectureReviewRecurrenceSchedule? loaded =
            await sut.GetByIdAsync(scheduleId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.Name.Should().Be("Weekly review");

        schedule.Name = "Updated weekly review";
        await sut.UpdateAsync(schedule, CancellationToken.None);

        ArchitectureReviewRecurrenceSchedule? updated =
            await sut.GetByIdAsync(scheduleId, CancellationToken.None);

        updated!.Name.Should().Be("Updated weekly review");

        IReadOnlyList<ArchitectureReviewRecurrenceSchedule> due =
            await sut.ListDueAsync(dueUtc.AddMinutes(1), take: 5, CancellationToken.None);

        due.Should().ContainSingle(x => x.ScheduleId == scheduleId);

        IReadOnlyList<ArchitectureReviewRecurrenceSchedule> scoped =
            await sut.ListByScopeAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        scoped.Should().ContainSingle(x => x.ScheduleId == scheduleId);
    }

    [Fact]
    public async Task Duplicate_schedule_id_does_not_create_a_second_due_review()
    {
        InMemoryArchitectureReviewRecurrenceScheduleRepository sut = new();
        DateTime dueUtc = new(2026, 7, 10, 8, 0, 0, DateTimeKind.Utc);
        ArchitectureReviewRecurrenceSchedule schedule = new()
        {
            ScheduleId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            SourceRunId = Guid.NewGuid(),
            IsEnabled = true,
            NextRunUtc = dueUtc
        };

        await sut.CreateAsync(schedule, CancellationToken.None);
        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.CreateAsync(schedule, CancellationToken.None));

        IReadOnlyList<ArchitectureReviewRecurrenceSchedule> due =
            await sut.ListDueAsync(dueUtc, take: 10, CancellationToken.None);
        due.Should().ContainSingle().Which.ScheduleId.Should().Be(schedule.ScheduleId);
    }

    [Fact]
    public async Task Scheduler_changes_are_visible_only_after_update()
    {
        InMemoryArchitectureReviewRecurrenceScheduleRepository sut = new();
        DateTime dueUtc = new(2026, 7, 10, 8, 0, 0, DateTimeKind.Utc);
        ArchitectureReviewRecurrenceSchedule schedule = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            NextRunUtc = dueUtc,
        };

        await sut.CreateAsync(schedule, CancellationToken.None);
        schedule.IsEnabled = false;

        IReadOnlyList<ArchitectureReviewRecurrenceSchedule> due =
            await sut.ListDueAsync(dueUtc, take: 1, CancellationToken.None);
        ArchitectureReviewRecurrenceSchedule checkpoint = due.Should().ContainSingle().Subject;
        checkpoint.NextRunUtc = dueUtc.AddDays(7);
        checkpoint.LastTriggeredRunId = Guid.NewGuid();

        IReadOnlyList<ArchitectureReviewRecurrenceSchedule> scoped = await sut.ListByScopeAsync(
            schedule.TenantId, schedule.WorkspaceId, schedule.ProjectId, CancellationToken.None);
        ArchitectureReviewRecurrenceSchedule listed = scoped.Should().ContainSingle().Subject;
        listed.NextRunUtc.Should().Be(dueUtc);
        listed.LastTriggeredRunId.Should().BeNull();
        listed.IsEnabled = false;

        ArchitectureReviewRecurrenceSchedule? loaded = await sut.GetByIdAsync(schedule.ScheduleId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded!.IsEnabled.Should().BeTrue();
        loaded.IsEnabled = false;

        await sut.UpdateAsync(checkpoint, CancellationToken.None);
        checkpoint.NextRunUtc = dueUtc;

        (await sut.ListDueAsync(dueUtc, take: 1, CancellationToken.None)).Should().BeEmpty();
        loaded = await sut.GetByIdAsync(schedule.ScheduleId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded!.IsEnabled.Should().BeTrue();
        loaded.NextRunUtc.Should().Be(dueUtc.AddDays(7));
        loaded.LastTriggeredRunId.Should().Be(checkpoint.LastTriggeredRunId);
    }

    [Fact]
    public async Task ListDueAsync_clamps_take_and_ignores_disabled_or_future_schedules()
    {
        InMemoryArchitectureReviewRecurrenceScheduleRepository sut = new();
        DateTime nowUtc = new(2026, 7, 10, 12, 0, 0, DateTimeKind.Utc);

        await sut.CreateAsync(
            new ArchitectureReviewRecurrenceSchedule
            {
                ScheduleId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                IsEnabled = false,
                NextRunUtc = nowUtc.AddHours(-1),
            },
            CancellationToken.None);

        await sut.CreateAsync(
            new ArchitectureReviewRecurrenceSchedule
            {
                ScheduleId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                IsEnabled = true,
                NextRunUtc = nowUtc.AddHours(1),
            },
            CancellationToken.None);

        IReadOnlyList<ArchitectureReviewRecurrenceSchedule> due =
            await sut.ListDueAsync(nowUtc, take: 0, CancellationToken.None);

        due.Should().BeEmpty();
    }
}
