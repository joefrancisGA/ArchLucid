using System.Text.Json;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     One-line JSON diagnostics to stderr so hangs remain visible even when ILogger is filtered.
/// </summary>
public static class ConsoleHangDiagnostics
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

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
        Console.Error.WriteLine(FormatLine(component, eventName, fields));
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
}
