using System.Text.Json;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     One-line JSON hang breadcrumbs. Prefer <see cref="ILogger" /> (Serilog <c>[WRN]</c> in the API window).
///     Never write to <see cref="Console.Error" /> on the caller thread: a full stderr pipe or console lock
///     blocks indefinitely and does not observe <c>RequestAborted</c>.
/// </summary>
public static class ConsoleHangDiagnostics
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static ILogger? _logger;

    private static int _stderrWriteInFlight;

    public static void UseLogger(ILogger? logger)
    {
        Volatile.Write(ref _logger, logger);
    }

    public static string FormatLine(string component, string eventName, IReadOnlyDictionary<string, object?> fields)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(component);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventName);
        ArgumentNullException.ThrowIfNull(fields);

        Dictionary<string, object?> payload = new(fields.Count + 2)
        {
            ["component"] = component,
            ["event"] = eventName
        };

        foreach (KeyValuePair<string, object?> field in fields)
        {
            if (field.Value is not null)
            {
                payload[field.Key] = field.Value;
            }
        }

        return JsonSerializer.Serialize(payload, SerializerOptions);
    }

    public static void Log(string component, string eventName, IReadOnlyDictionary<string, object?> fields)
    {
        string line = FormatLine(component, eventName, fields);
        ILogger? logger = Volatile.Read(ref _logger);

        if (logger is not null)
        {
            // JSON `{` / `}` must not be the MEL template; pass the line as a named argument.
            logger.LogWarning("{HangDiagnosticJson}", line);
            return;
        }

        QueueStderrWrite(line);
    }

    public static void Log(string component, string eventName, params (string Key, object? Value)[] fields)
    {
        ArgumentNullException.ThrowIfNull(fields);

        Dictionary<string, object?> map = new(fields.Length);

        foreach ((string key, object? value) in fields)
        {
            map[key] = value;
        }

        Log(component, eventName, map);
    }

    private static void QueueStderrWrite(string line)
    {
        if (Interlocked.CompareExchange(ref _stderrWriteInFlight, 1, 0) != 0)
            return;

        ThreadPool.UnsafeQueueUserWorkItem(
            static state =>
            {
                try
                {
                    Console.Error.WriteLine((string)state!);
                }
                catch (Exception)
                {
                    // A blocked console must not take down a ThreadPool worker.
                }
                finally
                {
                    Interlocked.Exchange(ref _stderrWriteInFlight, 0);
                }
            },
            line);
    }
}
