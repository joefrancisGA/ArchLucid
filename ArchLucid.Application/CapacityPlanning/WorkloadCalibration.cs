namespace ArchLucid.Application.CapacityPlanning;

/// <summary>Versioned benchmark observation; validity is explicit and never inferred from presence alone.</summary>
public static class WorkloadCalibration
{
    public sealed record Observation(int SchemaVersion, string Revision, string Workload,
        decimal WorkUnits, decimal CpuSeconds, decimal WorkerSeconds,
        decimal MemoryObservedGiB, bool MemoryIsTruePeak, string MeasurementScope);
    public sealed record Assessment(bool Valid, string Status, decimal? CpuSecondsPerUnit, decimal? WorkerSecondsPerUnit);

    public static Assessment Assess(Observation? observation)
    {
        if (observation is null) return new(false, "NO_OBSERVATION", null, null);
        if (observation.SchemaVersion != 1 || string.IsNullOrWhiteSpace(observation.Revision) ||
            string.IsNullOrWhiteSpace(observation.Workload) || observation.WorkUnits <= 0 ||
            observation.CpuSeconds < 0 || observation.WorkerSeconds < 0 ||
            observation.MemoryObservedGiB < 0 || string.IsNullOrWhiteSpace(observation.MeasurementScope))
            return new(false, "INVALID_OBSERVATION", null, null);
        if (observation.MeasurementScope != "ISOLATED_OPERATION")
            return new(false, "PROCESS_WIDE_NOT_CALIBRATED", null, null);
        return new(true, observation.MemoryIsTruePeak ? "ISOLATED_PROFILE" : "MEMORY_NOT_PEAK",
            observation.CpuSeconds / observation.WorkUnits,
            observation.WorkerSeconds / observation.WorkUnits);
    }
}
