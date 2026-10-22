using System.Text.Json;

namespace ArchLucid.Application.Jobs;

/// <summary>Shared JSON options for persisting <see cref = "BackgroundJobWorkUnit"/>.</summary>
public static class BackgroundJobWorkUnitJson
{
    public static JsonSerializerOptions Options
    {
        get;
    } = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public static string Serialize(BackgroundJobWorkUnit workUnit)
    {
        ArgumentNullException.ThrowIfNull(workUnit);
        return JsonSerializer.Serialize(workUnit, Options);
    }

    public static BackgroundJobWorkUnit? Deserialize(string json)
    {
        ArgumentNullException.ThrowIfNull(json);
        return string.IsNullOrWhiteSpace(json) ? null : JsonSerializer.Deserialize<BackgroundJobWorkUnit>(json, Options);
    }

    /// <summary>
    ///     Fail-closed read for tenant-scope authorization — malformed JSON must not leak job existence via 500.
    /// </summary>
    public static BackgroundJobWorkUnit? TryDeserialize(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<BackgroundJobWorkUnit>(json, Options);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
