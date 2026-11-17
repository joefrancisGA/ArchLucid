namespace ArchLucid.Application.SecureNow;

/// <summary>
/// Deterministic capacity-cost scenario model, not a measured bill or calibrated forecast.
/// Rates and resource consumption MUST be supplied by a caller from an audited source.
/// </summary>
public static class SecureNowCapacityCostForecast
{
    public sealed record Workload(
        long SnapshotsPerMonth,
        decimal CpuSecondsPerSnapshot,
        decimal PeakGiBPerWorker,
        decimal WorkerSecondsPerSnapshot,
        decimal StorageGiBMonths,
        decimal SqlOperationsPerSnapshot);

    public sealed record Rates(
        decimal CpuUsdPerSecond,
        decimal MemoryGiBUsdPerSecond,
        decimal StorageGiBMonthUsd,
        decimal SqlUsdPerOperation);

    public sealed record Result(
        decimal ComputeUsd,
        decimal StorageUsd,
        decimal SqlUsd,
        decimal TotalUsd,
        bool Calibrated,
        string EvidenceStatus);

    public static Result Calculate(Workload workload, Rates rates, bool ratesAndUsageMeasured)
    {
        ArgumentNullException.ThrowIfNull(workload);
        ArgumentNullException.ThrowIfNull(rates);
        if (workload.SnapshotsPerMonth < 0 || workload.CpuSecondsPerSnapshot < 0 ||
            workload.PeakGiBPerWorker < 0 || workload.WorkerSecondsPerSnapshot < 0 ||
            workload.StorageGiBMonths < 0 || workload.SqlOperationsPerSnapshot < 0 ||
            rates.CpuUsdPerSecond < 0 || rates.MemoryGiBUsdPerSecond < 0 ||
            rates.StorageGiBMonthUsd < 0 || rates.SqlUsdPerOperation < 0)
            throw new ArgumentOutOfRangeException(nameof(workload), "Capacity and rates must be nonnegative.");

        // Checked decimal arithmetic fails closed if a scenario exceeds representable bounds.
        decimal compute = checked(workload.SnapshotsPerMonth *
            (workload.CpuSecondsPerSnapshot * rates.CpuUsdPerSecond +
             workload.PeakGiBPerWorker * workload.WorkerSecondsPerSnapshot * rates.MemoryGiBUsdPerSecond));
        decimal storage = checked(workload.StorageGiBMonths * rates.StorageGiBMonthUsd);
        decimal sql = checked(workload.SnapshotsPerMonth * workload.SqlOperationsPerSnapshot * rates.SqlUsdPerOperation);
        return new Result(compute, storage, sql, checked(compute + storage + sql),
            ratesAndUsageMeasured, ratesAndUsageMeasured ? "MEASURED_INPUT_SCENARIO" : "UNCALIBRATED_SCENARIO");
    }
}
