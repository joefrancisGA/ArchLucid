using ArchLucid.Contracts.Advisory.Scheduling;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryAdvisoryScanScheduleRepositoryContractTests : AdvisoryScanScheduleRepositoryContractTests
{
    protected override IAdvisoryScanScheduleRepository CreateRepository()
    {
        return new InMemoryAdvisoryScanScheduleRepository();
    }

    [Fact]
    public async Task Duplicate_schedule_id_does_not_create_a_second_due_scan()
    {
        IAdvisoryScanScheduleRepository repo = CreateRepository();
        DateTime dueUtc = new(2026, 3, 15, 12, 0, 0, DateTimeKind.Utc);
        AdvisoryScanSchedule schedule = new()
        {
            ScheduleId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            IsEnabled = true,
            NextRunUtc = dueUtc
        };

        await repo.CreateAsync(schedule, CancellationToken.None);
        await Assert.ThrowsAsync<InvalidOperationException>(() => repo.CreateAsync(schedule, CancellationToken.None));

        IReadOnlyList<AdvisoryScanSchedule> due = await repo.ListDueAsync(dueUtc, 10, CancellationToken.None);
        due.Should().ContainSingle().Which.ScheduleId.Should().Be(schedule.ScheduleId);
    }

    [Fact]
    public async Task Schedule_changes_are_visible_only_after_update()
    {
        IAdvisoryScanScheduleRepository repo = CreateRepository();
        DateTime dueUtc = new(2026, 3, 15, 12, 0, 0, DateTimeKind.Utc);
        AdvisoryScanSchedule schedule = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            NextRunUtc = dueUtc,
        };
        ScopeContext scope = new()
        {
            TenantId = schedule.TenantId,
            WorkspaceId = schedule.WorkspaceId,
            ProjectId = schedule.ProjectId,
        };

        await repo.CreateAsync(schedule, CancellationToken.None);
        schedule.IsEnabled = false;

        IReadOnlyList<AdvisoryScanSchedule> due = await repo.ListDueAsync(dueUtc, 10, CancellationToken.None);
        AdvisoryScanSchedule checkpoint = due.Should().ContainSingle(s => s.ScheduleId == schedule.ScheduleId).Subject;
        checkpoint.NextRunUtc = dueUtc.AddDays(1);

        AdvisoryScanSchedule? saved = await repo.GetByIdAsync(scope, schedule.ScheduleId, CancellationToken.None);
        saved.Should().NotBeNull();
        saved!.NextRunUtc.Should().Be(dueUtc);
        saved.IsEnabled = false;

        IReadOnlyList<AdvisoryScanSchedule> scoped = await repo.ListByScopeAsync(
            scope.TenantId, scope.WorkspaceId, scope.ProjectId, CancellationToken.None);
        AdvisoryScanSchedule listed = scoped.Should().ContainSingle().Subject;
        listed.IsEnabled.Should().BeTrue();
        listed.IsEnabled = false;

        await repo.UpdateAsync(checkpoint, CancellationToken.None);
        checkpoint.NextRunUtc = dueUtc;

        saved = await repo.GetByIdAsync(scope, schedule.ScheduleId, CancellationToken.None);
        saved.Should().NotBeNull();
        saved!.IsEnabled.Should().BeTrue();
        saved.NextRunUtc.Should().Be(dueUtc.AddDays(1));
    }
}
