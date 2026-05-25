namespace ArchLucid.Host.Core.Diagnostics;

/// <summary>Snapshot counters from <see cref="Microsoft.Data.SqlClient"/> EventSource event counters.</summary>
internal static class SqlClientMetrics
{
    private static long _activeConnections;

    private static long _idleConnections;

    private static long _poolWaitTimeMs;

    internal static void UpdateActiveConnections(long value) =>
        Interlocked.Exchange(ref _activeConnections, Math.Max(0, value));

    internal static void UpdateIdleConnections(long value) =>
        Interlocked.Exchange(ref _idleConnections, Math.Max(0, value));

    internal static void UpdatePoolWaitTimeMs(long value) =>
        Interlocked.Exchange(ref _poolWaitTimeMs, Math.Max(0, value));

    internal static long GetActiveConnections() => Interlocked.Read(ref _activeConnections);

    internal static long GetIdleConnections() => Interlocked.Read(ref _idleConnections);

    internal static long GetPoolWaitTimeMs() => Interlocked.Read(ref _poolWaitTimeMs);
}
