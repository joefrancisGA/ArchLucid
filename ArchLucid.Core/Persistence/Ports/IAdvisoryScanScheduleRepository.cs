using ArchLucid.Contracts.Advisory.Scheduling;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persistence for <see cref="AdvisoryScanSchedule" /> rows.</summary>
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

    Task<AdvisoryScanSchedule?> GetByIdAsync(ScopeContext scope, Guid scheduleId, CancellationToken ct);
}
