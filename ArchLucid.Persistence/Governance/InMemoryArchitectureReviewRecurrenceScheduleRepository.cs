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
            if (_items.Count >= MaxEntries)
                _items.RemoveAt(0);

            _items.Add(schedule);
        }

        return Task.CompletedTask;
    }

    public Task UpdateAsync(ArchitectureReviewRecurrenceSchedule schedule, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(schedule);
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            int index = _items.FindIndex(x => x.ScheduleId == schedule.ScheduleId);

            if (index >= 0)
                _items[index] = schedule;
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
                .ToList();

            return Task.FromResult<IReadOnlyList<ArchitectureReviewRecurrenceSchedule>>(result);
        }
    }

    public Task<ArchitectureReviewRecurrenceSchedule?> GetByIdAsync(Guid scheduleId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
            return Task.FromResult(_items.FirstOrDefault(x => x.ScheduleId == scheduleId));
    }
}
