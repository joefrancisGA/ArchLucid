using ArchiForge.Decisioning.Advisory.Scheduling;

namespace ArchiForge.Persistence.Advisory;

public interface IAdvisoryScanScheduleRepository
{
    Task CreateAsync(AdvisoryScanSchedule schedule, CancellationToken ct);
    Task UpdateAsync(AdvisoryScanSchedule schedule, CancellationToken ct);

    Task<IReadOnlyList<AdvisoryScanSchedule>> ListDueAsync(
        DateTime utcNow,
        int take,
        CancellationToken ct);

    Task<IReadOnlyList<AdvisoryScanSchedule>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    Task<AdvisoryScanSchedule?> GetByIdAsync(Guid scheduleId, CancellationToken ct);
}
