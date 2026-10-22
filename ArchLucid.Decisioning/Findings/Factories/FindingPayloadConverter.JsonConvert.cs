using System.Text.Json;

using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings.Factories;

public static partial class FindingPayloadConverter
{
    private static T? DeserializeJsonElementPayload<T>(Finding finding, JsonElement jsonElement)
    {
        if (jsonElement.ValueKind == JsonValueKind.String)
        {
            string? embeddedJson = jsonElement.GetString();

            if (!string.IsNullOrWhiteSpace(embeddedJson))
                return DeserializePayloadJson<T>(finding, NormalizeLlmJsonPayload(embeddedJson));
        }

        try
        {
            return jsonElement.Deserialize<T>(ForgivingOptions);
        }
        catch (JsonException ex)
        {
            throw CreateDeserializationFailure<T>(finding, ex);
        }
    }

    private static T? DeserializePayloadJson<T>(Finding finding, string json)
    {
        try
        {
            return JsonSerializer.Deserialize<T>(json, ForgivingOptions);
        }
        catch (JsonException ex)
        {
            throw CreateDeserializationFailure<T>(finding, ex);
        }
    }

    /// <summary>
    ///     LLM engines sometimes wrap JSON objects in markdown code fences; strip those before parsing.
    /// </summary>
    public static string NormalizeLlmJsonPayload(string raw)
    {
        string trimmed = raw.Trim();

        if (!trimmed.StartsWith("```", StringComparison.Ordinal))
            return trimmed;

        int firstNewline = trimmed.IndexOf('\n');

        if (firstNewline < 0)
            return trimmed;

        int contentStart = firstNewline + 1;
        int fenceEnd = trimmed.LastIndexOf("```", StringComparison.Ordinal);

        if (fenceEnd <= contentStart)
            return trimmed;

        return trimmed.Substring(contentStart, fenceEnd - contentStart).Trim();
    }

    private static InvalidOperationException CreateDeserializationFailure<T>(Finding finding, JsonException ex)
    {
        return new InvalidOperationException(
            $"Finding payload cannot be deserialized as {typeof(T).Name} (FindingId={finding.FindingId}).",
            ex);
    }
}
