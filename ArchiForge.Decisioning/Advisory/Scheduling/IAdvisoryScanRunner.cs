namespace ArchiForge.Decisioning.Advisory.Scheduling;

public interface IAdvisoryScanRunner
{
    Task RunScheduleAsync(AdvisoryScanSchedule schedule, CancellationToken ct);
}
