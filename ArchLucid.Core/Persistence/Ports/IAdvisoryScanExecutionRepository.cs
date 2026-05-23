using ArchLucid.Contracts.Advisory.Scheduling;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persistence for <see cref="AdvisoryScanExecution" /> audit/history rows.</summary>
public interface IAdvisoryScanExecutionRepository
{
    Task CreateAsync(AdvisoryScanExecution execution, CancellationToken ct);

    Task UpdateAsync(AdvisoryScanExecution execution, CancellationToken ct);

    Task<IReadOnlyList<AdvisoryScanExecution>> ListByScheduleAsync(
        Guid scheduleId,
        int take,
        CancellationToken ct);
}
