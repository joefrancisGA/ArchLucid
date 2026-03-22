using ArchiForge.Decisioning.Advisory.Scheduling;

namespace ArchiForge.Persistence.Advisory;

public interface IAdvisoryScanExecutionRepository
{
    Task CreateAsync(AdvisoryScanExecution execution, CancellationToken ct);
    Task UpdateAsync(AdvisoryScanExecution execution, CancellationToken ct);

    Task<IReadOnlyList<AdvisoryScanExecution>> ListByScheduleAsync(
        Guid scheduleId,
        int take,
        CancellationToken ct);
}
