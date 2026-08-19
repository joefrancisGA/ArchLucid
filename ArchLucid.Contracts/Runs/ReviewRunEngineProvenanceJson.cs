using System.Text.Json;

namespace ArchLucid.Contracts.Runs;

/// <summary>JSON helpers for <see cref="ReviewRunEngineProvenance" /> persisted on <c>dbo.Runs.EngineProvenanceJson</c>.</summary>
public static class ReviewRunEngineProvenanceJson
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public static string Serialize(ReviewRunEngineProvenance provenance)
    {
        ArgumentNullException.ThrowIfNull(provenance);

        return JsonSerializer.Serialize(provenance, SerializerOptions);
    }

    public static ReviewRunEngineProvenance? TryDeserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<ReviewRunEngineProvenance>(json, SerializerOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
