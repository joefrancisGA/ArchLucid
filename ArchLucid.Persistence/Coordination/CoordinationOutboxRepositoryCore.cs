namespace ArchLucid.Persistence.Coordination;

/// <summary>Shared cursor/retry/clone/cap rules for coordination outbox SQL and in-memory twins.</summary>
internal static class CoordinationOutboxRepositoryCore
{
    public const int MaxDequeueBatch = 100;

    public const int MinLeaseDurationSeconds = 60;

    public const int MaxLeaseDurationSeconds = 7200;

    public static int ClampDequeueBatch(int maxBatch) => Math.Clamp(maxBatch, 1, MaxDequeueBatch);

    public static int ClampLeaseDurationSeconds(int leaseDurationSeconds) =>
        Math.Clamp(leaseDurationSeconds, MinLeaseDurationSeconds, MaxLeaseDurationSeconds);

    public static bool IsEligibleForDequeue(
        DateTime? processedUtc,
        DateTime? deadLetteredUtc,
        DateTime? nextAttemptUtc,
        DateTime? lockedUntilUtc,
        DateTime nowUtc) =>
        processedUtc is null
        && deadLetteredUtc is null
        && (nextAttemptUtc is null || nextAttemptUtc <= nowUtc)
        && (lockedUntilUtc is null || lockedUntilUtc <= nowUtc);

    public static bool CanMarkProcessed(DateTime? processedUtc) => processedUtc is null;

    public static bool CanRecordBackoff(DateTime? processedUtc, DateTime? deadLetteredUtc) =>
        processedUtc is null && deadLetteredUtc is null;

    public static bool CanRecordDeadLetter(DateTime? processedUtc, DateTime? deadLetteredUtc) =>
        processedUtc is null && deadLetteredUtc is null;

    public static bool IsPendingCount(DateTime? processedUtc, DateTime? deadLetteredUtc) =>
        processedUtc is null && deadLetteredUtc is null;

    public static bool IsDeadLetteredCount(DateTime? processedUtc, DateTime? deadLetteredUtc) =>
        deadLetteredUtc is not null && processedUtc is null;

    public static DateTime NormalizeUtc(DateTime value) =>
        value.Kind is DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();

    public static IEnumerable<T> OrderEligibleForDequeue<T>(
        IEnumerable<T> rows,
        Func<T, DateTime?> processedUtc,
        Func<T, DateTime?> deadLetteredUtc,
        Func<T, DateTime?> nextAttemptUtc,
        Func<T, DateTime?> lockedUntilUtc,
        Func<T, DateTime> createdUtc,
        Func<T, Guid> outboxId,
        DateTime nowUtc)
    {
        ArgumentNullException.ThrowIfNull(rows);
        ArgumentNullException.ThrowIfNull(processedUtc);
        ArgumentNullException.ThrowIfNull(deadLetteredUtc);
        ArgumentNullException.ThrowIfNull(nextAttemptUtc);
        ArgumentNullException.ThrowIfNull(lockedUntilUtc);
        ArgumentNullException.ThrowIfNull(createdUtc);
        ArgumentNullException.ThrowIfNull(outboxId);

        return rows
            .Where(row => IsEligibleForDequeue(
                processedUtc(row),
                deadLetteredUtc(row),
                nextAttemptUtc(row),
                lockedUntilUtc(row),
                nowUtc))
            .OrderBy(createdUtc)
            .ThenBy(outboxId);
    }
}
