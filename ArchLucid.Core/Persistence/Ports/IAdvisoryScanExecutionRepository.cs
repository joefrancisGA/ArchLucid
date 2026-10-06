using ArchLucid.Contracts.Advisory.Scheduling;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persistence for <see cref="AdvisoryScanExecution" /> audit/history rows.</summary>
public interface IAdvisoryScanExecutionRepository
{
    Task CreateAsync(AdvisoryScanExecution execution, CancellationToken ct);

    Task UpdateAsync(AdvisoryScanExecution execution, CancellationToken ct);

    Task<IReadOnlyList<AdvisoryScanExecution>> ListByScheduleAsync(
        ScopeContext scope,
        Guid scheduleId,
        int take,
        CancellationToken ct);
}
