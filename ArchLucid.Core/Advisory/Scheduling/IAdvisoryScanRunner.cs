using ArchLucid.Contracts.Advisory.Scheduling;

namespace ArchLucid.Core.Advisory.Scheduling;

public interface IAdvisoryScanRunner
{
    Task RunScheduleAsync(AdvisoryScanSchedule schedule, CancellationToken ct);
}
