namespace ArchLucid.Application.CapacityPlanning;

/// <summary>Read-only workload scenario model. Caller-supplied resource units are assumptions unless calibrated.</summary>
public static class WorkloadInfrastructureForecast
{
    public enum WorkloadKind { ArchitectureReview, DocumentIngestion, AiInference, Retrieval, GraphAnalysis, BackgroundJob }
    public sealed record Demand(WorkloadKind Kind, long Count, decimal CpuSecondsEach, decimal WorkerSecondsEach,
        decimal MemoryGiBPerWorker, decimal SqlOperationsEach, decimal StorageGiBMonthsEach,
        decimal InputTokensEach = 0, decimal OutputTokensEach = 0);
    public sealed record Capacity(decimal VcpuPerWorker, decimal MemoryGiBPerWorker, decimal TargetUtilization,
        decimal ProcessingHours, int MaximumWorkers);
    public sealed record Prices(decimal VcpuSecondUsd, decimal MemoryGiBSecondUsd, decimal SqlOperationUsd,
        decimal StorageGiBMonthUsd, decimal InputTokenUsd, decimal OutputTokenUsd);
    public sealed record Result(decimal CpuSeconds, decimal WorkerSeconds, decimal SqlOperations,
        decimal StorageGiBMonths, decimal InputTokens, decimal OutputTokens,
        int RequiredWorkers, bool Feasible, decimal? CostUsd, string EvidenceStatus);

    public static Result Estimate(IReadOnlyCollection<Demand> demands, Capacity capacity, Prices? prices = null,
        bool calibrated = false)
    {
        ArgumentNullException.ThrowIfNull(demands);
        ArgumentNullException.ThrowIfNull(capacity);
        if (capacity.VcpuPerWorker <= 0 || capacity.MemoryGiBPerWorker <= 0 ||
            capacity.TargetUtilization <= 0 || capacity.TargetUtilization > 1 ||
            capacity.ProcessingHours <= 0 || capacity.MaximumWorkers <= 0)
            throw new ArgumentOutOfRangeException(nameof(capacity));
        if (prices is not null && (prices.VcpuSecondUsd < 0 || prices.MemoryGiBSecondUsd < 0 ||
            prices.SqlOperationUsd < 0 || prices.StorageGiBMonthUsd < 0 ||
            prices.InputTokenUsd < 0 || prices.OutputTokenUsd < 0))
            throw new ArgumentOutOfRangeException(nameof(prices));

        decimal cpu = 0, worker = 0, sql = 0, storage = 0, input = 0, output = 0;
        decimal memoryRequired = 0;
        foreach (Demand d in demands)
        {
            if (d.Count < 0 || d.CpuSecondsEach < 0 || d.WorkerSecondsEach < 0 ||
                d.MemoryGiBPerWorker < 0 || d.SqlOperationsEach < 0 || d.StorageGiBMonthsEach < 0 ||
                d.InputTokensEach < 0 || d.OutputTokensEach < 0)
                throw new ArgumentOutOfRangeException(nameof(demands));
            cpu = checked(cpu + d.Count * d.CpuSecondsEach);
            worker = checked(worker + d.Count * d.WorkerSecondsEach);
            sql = checked(sql + d.Count * d.SqlOperationsEach);
            storage = checked(storage + d.Count * d.StorageGiBMonthsEach);
            input = checked(input + d.Count * d.InputTokensEach);
            output = checked(output + d.Count * d.OutputTokensEach);
            if (d.Count > 0) memoryRequired = Math.Max(memoryRequired, d.MemoryGiBPerWorker);
        }
        decimal seconds = capacity.ProcessingHours * 3600m * capacity.TargetUtilization;
        decimal cpuWorkers = Math.Ceiling(cpu / checked(seconds * capacity.VcpuPerWorker));
        decimal timeWorkers = Math.Ceiling(worker / seconds);
        decimal required = Math.Max(cpuWorkers, timeWorkers);
        bool feasible = memoryRequired <= capacity.MemoryGiBPerWorker && required <= capacity.MaximumWorkers
            && required <= int.MaxValue;
        int count = required > int.MaxValue ? int.MaxValue : (int)required;
        decimal? cost = prices is null ? null : checked(
            cpu * prices.VcpuSecondUsd + worker * memoryRequired * prices.MemoryGiBSecondUsd +
            sql * prices.SqlOperationUsd + storage * prices.StorageGiBMonthUsd +
            input * prices.InputTokenUsd + output * prices.OutputTokenUsd);
        return new Result(cpu, worker, sql, storage, input, output, count, feasible, cost,
            calibrated ? "CALLER_ATTESTED_CALIBRATION" : "UNCALIBRATED_SCENARIO");
    }
}
