using System.Text.Json;

namespace ArchLucid.Core.InfraEvidence;

public static class AzureInventorySnapshotCompletenessWarningsJson
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static string? Serialize(IReadOnlyList<string>? warnings)
    {
        if (warnings is null || warnings.Count == 0)
        {
            return null;
        }

        List<string> ordered = warnings
            .Where(static warning => !string.IsNullOrWhiteSpace(warning))
            .Select(static warning => warning.Trim())
            .Distinct(StringComparer.Ordinal)
            .OrderBy(static warning => warning, StringComparer.Ordinal)
            .ToList();

        if (ordered.Count == 0)
        {
            return null;
        }

        return JsonSerializer.Serialize(ordered, SerializerOptions);
    }

    public static IReadOnlyList<string> Deserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            List<string>? warnings = JsonSerializer.Deserialize<List<string>>(json, SerializerOptions);

            if (warnings is null || warnings.Count == 0)
            {
                return [];
            }

            return warnings
                .Where(static warning => !string.IsNullOrWhiteSpace(warning))
                .Select(static warning => warning.Trim())
                .Distinct(StringComparer.Ordinal)
                .OrderBy(static warning => warning, StringComparer.Ordinal)
                .ToList();
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
