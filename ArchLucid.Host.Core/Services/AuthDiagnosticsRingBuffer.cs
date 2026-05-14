namespace ArchLucid.Host.Core.Services;

/// <summary>
///     Thread-safe, fixed-capacity ring buffer that stores recent <see cref="AuthDiagnosticEntry" /> records.
///     When capacity is reached the oldest entry is evicted. Default capacity: 200 entries.
/// </summary>
public sealed class AuthDiagnosticsRingBuffer : IAuthDiagnosticsRingBuffer
{
    private const int DefaultCapacity = 200;

    private readonly Queue<AuthDiagnosticEntry> _entries = new();
    private readonly Lock _lock = new();
    private readonly int _capacity;

    public AuthDiagnosticsRingBuffer(int capacity = DefaultCapacity)
    {
        _capacity = capacity is > 0 and <= 10_000 ? capacity : DefaultCapacity;
    }

    /// <inheritdoc />
    public void Record(AuthDiagnosticEntry entry)
    {
        lock (_lock)
        {
            while (_entries.Count >= _capacity)
                _entries.Dequeue();

            _entries.Enqueue(entry);
        }
    }

    /// <inheritdoc />
    public IReadOnlyList<AuthDiagnosticEntry> GetRecent(int maxCount = 50)
    {
        lock (_lock)
        {
            AuthDiagnosticEntry[] all = _entries.ToArray();

            return all.Length <= maxCount ? all : all[^maxCount..];
        }
    }
}
