using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Tests.Diagnostics;

internal sealed class HangDiagnosticCollectingLogger : ILogger
{
    private readonly List<(LogLevel Level, string Message)> _entries;

    public HangDiagnosticCollectingLogger(List<(LogLevel Level, string Message)> entries)
    {
        _entries = entries ?? throw new ArgumentNullException(nameof(entries));
    }

    public IDisposable? BeginScope<TState>(TState state)
        where TState : notnull => null;

    public bool IsEnabled(LogLevel logLevel) => true;

    public void Log<TState>(
        LogLevel logLevel,
        EventId eventId,
        TState state,
        Exception? exception,
        Func<TState, Exception?, string> formatter)
    {
        ArgumentNullException.ThrowIfNull(formatter);

        _entries.Add((logLevel, formatter(state, exception)));
    }
}
