using System.Text.Json;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Temporary one-line JSON diagnostics for <c>GET /v1/learning/plans</c> 60s hangs. Remove after root cause is found.
/// </summary>
public static class LearningPlansHangDiagnostics
{
    public const string Component = "archlucid-api-learning-plans-diag";

    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static void Log(string eventName, IReadOnlyDictionary<string, object?> fields)
    {
        Dictionary<string, object?> payload = new(fields.Count + 2)
        {
            ["component"] = Component,
            ["event"] = eventName
        };

        foreach (KeyValuePair<string, object?> field in fields)
        {
            if (field.Value is not null)
            {
                payload[field.Key] = field.Value;
            }
        }

        Console.Error.WriteLine(JsonSerializer.Serialize(payload, SerializerOptions));
    }

    public static void Log(string eventName, params (string Key, object? Value)[] fields)
    {
        Dictionary<string, object?> payload = new(fields.Length + 2)
        {
            ["component"] = Component,
            ["event"] = eventName
        };

        foreach ((string key, object? value) in fields)
        {
            if (value is not null)
            {
                payload[key] = value;
            }
        }

        Console.Error.WriteLine(JsonSerializer.Serialize(payload, SerializerOptions));
    }
}
