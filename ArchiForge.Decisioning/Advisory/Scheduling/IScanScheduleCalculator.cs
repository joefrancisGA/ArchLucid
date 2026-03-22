namespace ArchiForge.Decisioning.Advisory.Scheduling;

public interface IScanScheduleCalculator
{
    DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc);
}
