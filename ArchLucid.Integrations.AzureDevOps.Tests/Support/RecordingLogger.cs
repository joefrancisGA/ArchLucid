using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureDevOps.Tests.Support;

/// <summary>Logger test double that reports every level as enabled and records formatted entries.</summary>
/// <remarks>
///     <c>NullLogger&lt;T&gt;</c> reports <c>IsEnabled</c> as <see langword="false" />, so production code that guards
///     logging with <c>if (_logger.IsEnabled(...))</c> never executes the guarded branch under it. Tests that need to
///     assert on log output — or to exercise those branches — must supply a logger that opts in.
/// </remarks>
internal sealed class RecordingLogger<T> : ILogger<T>
{
    private readonly List<RecordedLogEntry> _entries = [];

    internal IReadOnlyList<RecordedLogEntry> Entries => _entries;

    public IDisposable BeginScope<TState>(TState state)
        where TState : notnull
    {
        return NullLogScope.Instance;
    }

    public bool IsEnabled(LogLevel logLevel)
    {
        return true;
    }

    public void Log<TState>(
        LogLevel logLevel,
        EventId eventId,
        TState state,
        Exception? exception,
        Func<TState, Exception?, string> formatter)
    {
        ArgumentNullException.ThrowIfNull(formatter);

        _entries.Add(new RecordedLogEntry(logLevel, formatter(state, exception), exception));
    }
}
