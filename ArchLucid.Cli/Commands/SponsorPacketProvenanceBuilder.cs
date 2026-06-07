using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>Composes provenance pointers from existing proof-packet JSON files.</summary>
public static class SponsorPacketProvenanceBuilder
{
    private static readonly JsonSerializerOptions JsonWrite = new() { WriteIndented = true };

    public static string BuildJson(string runId, string? auditSampleJson, string? artifactManifestJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        IReadOnlyList<string> auditEventIds = ReadStringArray(auditSampleJson, "auditEventIds");
        IReadOnlyList<string> artifactIds = ReadStringArray(artifactManifestJson, "artifactIds");

        Dictionary<string, object?> payload = new(StringComparer.Ordinal)
        {
            ["schema"] = SponsorPacketArtifactCatalog.ProvenanceSchema,
            ["runId"] = runId.Trim(),
            ["capturedUtc"] = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
            ["auditEventIds"] = auditEventIds,
            ["artifactIds"] = artifactIds,
            ["note"] = "Ids only — fetch full payloads through authenticated operator APIs when needed.",
        };

        return JsonSerializer.Serialize(payload, JsonWrite);
    }

    private static IReadOnlyList<string> ReadStringArray(string? json, string propertyName)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;

            if (!root.TryGetProperty(propertyName, out JsonElement array) || array.ValueKind != JsonValueKind.Array)
                return [];

            List<string> values = [];

            foreach (JsonElement item in array.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.String)
                {
                    string? value = item.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        values.Add(value);
                }
            }

            return values;
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
