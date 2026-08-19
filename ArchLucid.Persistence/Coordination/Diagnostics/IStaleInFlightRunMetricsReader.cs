namespace ArchLucid.Persistence.Coordination.Diagnostics;

/// <summary>Reads fleet-wide stale in-flight run counts/ages for observability (TB-958).</summary>
public interface IStaleInFlightRunMetricsReader
{
    Task<StaleInFlightRunMetricsSnapshot> ReadSnapshotAsync(CancellationToken cancellationToken = default);
}
