using System.Diagnostics;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Tracks elapsed wall-clock time for the current logical SQL connection-open attempt, including Polly retries on the same
///     async execution flow (<see cref="AsyncLocal{T}" />).
/// </summary>
public sealed class SqlConnectionOpenAttemptTiming
{
    private readonly AsyncLocal<Stopwatch?> _stopwatch = new();

    public long ElapsedMilliseconds => _stopwatch.Value?.ElapsedMilliseconds ?? 0;

    public void BeginAttempt()
    {
        _stopwatch.Value = Stopwatch.StartNew();
    }

    public void EndAttempt()
    {
        _stopwatch.Value = null;
    }
}
