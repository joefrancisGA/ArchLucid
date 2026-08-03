namespace ArchLucid.Persistence.Coordination.Diagnostics;

/// <summary>In-memory host: no durable runs → empty stale-run snapshot.</summary>
public sealed class InMemoryStaleInFlightRunMetricsReader : IStaleInFlightRunMetricsReader
{
    private static readonly StaleInFlightRunMetricsSnapshot Empty = new();

    /// <inheritdoc />
    public Task<StaleInFlightRunMetricsSnapshot> ReadSnapshotAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Empty);
    }
}
