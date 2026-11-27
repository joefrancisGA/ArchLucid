namespace ArchLucid.Application.InfraEvidence;

/// <summary>
/// Checks capture time for a current inventory consumer. Invoke only after authorizing the
/// exact snapshot. Historical reads use the requested snapshot and do not apply a wall-clock age limit.
/// </summary>
internal static class InventorySnapshotFreshness
{
    public static void EnsureCurrent(DateTime? capturedUtc, DateTimeOffset now, TimeSpan maxAge)
    {
        if (capturedUtc is not DateTime captured)
            throw new ConflictException("Current inventory is unavailable because the snapshot has no capture timestamp.");

        // SQL datetime2 stores UTC without a DateTimeKind. Never interpret it in server local time.
        DateTime capture = captured.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(captured, DateTimeKind.Utc)
            : captured.ToUniversalTime();

        if (capture > now.UtcDateTime)
            throw new ConflictException("Current inventory is unavailable because the snapshot capture timestamp is in the future.");

        if (now.UtcDateTime - capture >= maxAge)
            throw new ConflictException("The last inventory snapshot is too old to show as current. Collect new inventory or open the historical snapshot explicitly.");
    }
}
