using ArchLucid.Contracts.Governance;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persistence for <see cref="ArchitectureReviewRecurrenceSchedule"/> rows.</summary>
public interface IArchitectureReviewRecurrenceScheduleRepository
{
    Task CreateAsync(ArchitectureReviewRecurrenceSchedule schedule, CancellationToken cancellationToken = default);

    Task UpdateAsync(ArchitectureReviewRecurrenceSchedule schedule, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ArchitectureReviewRecurrenceSchedule>> ListDueAsync(
        DateTime utcNow,
        int take,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ArchitectureReviewRecurrenceSchedule>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task<ArchitectureReviewRecurrenceSchedule?> GetByIdAsync(Guid scheduleId, CancellationToken cancellationToken = default);
}
