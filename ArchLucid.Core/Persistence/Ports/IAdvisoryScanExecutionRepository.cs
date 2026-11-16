using ArchLucid.Contracts.Advisory.Scheduling;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persistence for <see cref="AdvisoryScanExecution" /> audit/history rows.</summary>
public interface IAdvisoryScanExecutionRepository
{
    Task CreateAsync(AdvisoryScanExecution execution, CancellationToken ct);

    Task UpdateAsync(AdvisoryScanExecution execution, CancellationToken ct);

    /// <summary>Records a failure only while the execution is still started.</summary>
    Task MarkFailedIfStartedAsync(
        ScopeContext scope,
        Guid executionId,
        DateTime completedUtc,
        string errorMessage,
        CancellationToken ct);

    Task<IReadOnlyList<AdvisoryScanExecution>> ListByScheduleAsync(
        ScopeContext scope,
        Guid scheduleId,
        int take,
        CancellationToken ct);
}
