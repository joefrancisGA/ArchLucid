using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Persistence.Governance;

public sealed class InMemoryArchitectureReviewRecurrenceScheduleRepository : IArchitectureReviewRecurrenceScheduleRepository
{
    private const int MaxEntries = 500;

    private readonly List<ArchitectureReviewRecurrenceSchedule> _items = [];
    private readonly Lock _gate = new();

    public Task CreateAsync(ArchitectureReviewRecurrenceSchedule schedule, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(schedule);
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            if (_items.Exists(item => item.ScheduleId == schedule.ScheduleId))
                throw new InvalidOperationException($"The architecture review recurrence schedule '{schedule.ScheduleId}' already exists.");

            if (_items.Count >= MaxEntries)
                _items.RemoveAt(0);

            _items.Add(Copy(schedule));
        }

        return Task.CompletedTask;
    }

    public Task UpdateAsync(ArchitectureReviewRecurrenceSchedule schedule, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(schedule);
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            ArchitectureReviewRecurrenceSchedule? stored = _items.Find(row =>
                row.ScheduleId == schedule.ScheduleId &&
                row.TenantId == schedule.TenantId &&
                row.WorkspaceId == schedule.WorkspaceId &&
                row.ProjectId == schedule.ProjectId);

            if (stored is null)
                return Task.CompletedTask;

            stored.Name = schedule.Name;
            stored.CronExpression = schedule.CronExpression;
            stored.IsEnabled = schedule.IsEnabled;
            stored.LastTriggeredUtc = schedule.LastTriggeredUtc;
            stored.LastTriggeredRunId = schedule.LastTriggeredRunId;
            stored.NextRunUtc = schedule.NextRunUtc;
            stored.LastRunStatus = schedule.LastRunStatus;
            stored.LastErrorMessage = schedule.LastErrorMessage;
            stored.ConsecutiveFailureCount = schedule.ConsecutiveFailureCount;
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<ArchitectureReviewRecurrenceSchedule>> ListDueAsync(
        DateTime utcNow,
        int take,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        int n = Math.Clamp(take <= 0 ? 10 : take, 1, 50);
        lock (_gate)
        {
            List<ArchitectureReviewRecurrenceSchedule> result = _items
                .Where(s => s is { IsEnabled: true, NextRunUtc: not null } && s.NextRunUtc <= utcNow)
                .OrderBy(s => s.NextRunUtc)
                .Take(n)
                .Select(Copy)
                .ToList();

            return Task.FromResult<IReadOnlyList<ArchitectureReviewRecurrenceSchedule>>(result);
        }
    }

    public Task<IReadOnlyList<ArchitectureReviewRecurrenceSchedule>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<ArchitectureReviewRecurrenceSchedule> result = _items
                .Where(s => s.TenantId == tenantId && s.WorkspaceId == workspaceId && s.ProjectId == projectId)
                .OrderByDescending(s => s.CreatedUtc)
                .Select(Copy)
                .ToList();

            return Task.FromResult<IReadOnlyList<ArchitectureReviewRecurrenceSchedule>>(result);
        }
    }

    public Task<ArchitectureReviewRecurrenceSchedule?> GetByIdAsync(Guid scheduleId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            ArchitectureReviewRecurrenceSchedule? schedule = _items.FirstOrDefault(x => x.ScheduleId == scheduleId);

            return Task.FromResult(schedule is null ? null : Copy(schedule));
        }
    }

    private static ArchitectureReviewRecurrenceSchedule Copy(ArchitectureReviewRecurrenceSchedule schedule) => new()
    {
        ScheduleId = schedule.ScheduleId,
        TenantId = schedule.TenantId,
        WorkspaceId = schedule.WorkspaceId,
        ProjectId = schedule.ProjectId,
        SourceRunId = schedule.SourceRunId,
        ArchitectureId = schedule.ArchitectureId,
        Name = schedule.Name,
        CronExpression = schedule.CronExpression,
        IsEnabled = schedule.IsEnabled,
        CreatedUtc = schedule.CreatedUtc,
        LastTriggeredUtc = schedule.LastTriggeredUtc,
        LastTriggeredRunId = schedule.LastTriggeredRunId,
        NextRunUtc = schedule.NextRunUtc,
        CreatedByUserId = schedule.CreatedByUserId,
        LastRunStatus = schedule.LastRunStatus,
        LastErrorMessage = schedule.LastErrorMessage,
        ConsecutiveFailureCount = schedule.ConsecutiveFailureCount,
    };
}
