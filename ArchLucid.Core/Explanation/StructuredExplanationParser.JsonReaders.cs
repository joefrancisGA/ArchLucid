using System.Text.Json;

namespace ArchLucid.Core.Explanation;

public static partial class StructuredExplanationParser
{
    private static List<string>? TryReadStringList(JsonElement root, string propertyName)
    {
        if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, propertyName, out JsonElement arrayElement))
        {
            return null;
        }

        if (arrayElement.ValueKind == JsonValueKind.String)
        {
            string? scalar = arrayElement.GetString();

            if (string.IsNullOrWhiteSpace(scalar))
                return null;

            return [scalar.Trim()];
        }

        if (arrayElement.ValueKind != JsonValueKind.Array)
        {
            if (RunExplanationAggregateJsonReader.TryReadNonEmptyTextToken(arrayElement, out string? scalar)
                && !string.IsNullOrWhiteSpace(scalar))
            {
                return [scalar.Trim()];
            }

            return null;
        }

        List<string> values = [];

        foreach (JsonElement item in arrayElement.EnumerateArray())
        {
            string? raw = TryReadStringListEntry(item);

            if (string.IsNullOrWhiteSpace(raw))
                continue;

            values.Add(raw.Trim());
        }

        return values;
    }

    private static string? TryReadStringListEntry(JsonElement item)
    {
        if (item.ValueKind == JsonValueKind.String)
            return item.GetString();

        if (item.ValueKind != JsonValueKind.Object)
            return null;

        return TryReadObjectStringProperty(item, "id", "text");
    }

    private static string? TryReadObjectStringProperty(JsonElement item, params ReadOnlySpan<string> propertyNames)
    {
        foreach (string propertyName in propertyNames)
        {

            if (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(item, propertyName, out JsonElement element)
                && element.ValueKind == JsonValueKind.String)
            {
                return element.GetString();
            }
        }

        return null;
    }

    private static string? TryReadReasoningText(JsonElement reasoningElement)
    {
        if (reasoningElement.ValueKind == JsonValueKind.String)
            return reasoningElement.GetString();

        if (reasoningElement.ValueKind == JsonValueKind.Object)
            return TryReadObjectStringProperty(reasoningElement, "id", "text");

        if (reasoningElement.ValueKind != JsonValueKind.Array)
            return null;

        List<string> parts = [];

        foreach (JsonElement item in reasoningElement.EnumerateArray())
        {
            string? part = item.ValueKind switch
            {
                JsonValueKind.String => item.GetString(),
                JsonValueKind.Object => TryReadObjectStringProperty(item, "id", "text"),
                _ => null,
            };

            if (string.IsNullOrWhiteSpace(part))
                continue;

            parts.Add(part.Trim());
        }

        if (parts.Count == 0)
            return null;

        return string.Join("\n\n", parts);
    }
}
