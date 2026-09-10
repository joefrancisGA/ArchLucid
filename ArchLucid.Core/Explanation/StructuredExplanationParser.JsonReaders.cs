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

        if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(item, "id", out JsonElement idElement)
            || idElement.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return idElement.GetString();
    }

    private static string? TryReadReasoningText(JsonElement reasoningElement)
    {
        if (reasoningElement.ValueKind == JsonValueKind.String)
            return reasoningElement.GetString();

        if (reasoningElement.ValueKind == JsonValueKind.Object)
        {
            if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(reasoningElement, "text", out JsonElement textElement)
                || textElement.ValueKind != JsonValueKind.String)
            {
                return null;
            }

            return textElement.GetString();
        }

        if (reasoningElement.ValueKind != JsonValueKind.Array)
            return null;

        List<string> parts = [];

        foreach (JsonElement item in reasoningElement.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.String)
                continue;

            string? part = item.GetString();

            if (string.IsNullOrWhiteSpace(part))
                continue;

            parts.Add(part.Trim());
        }

        if (parts.Count == 0)
            return null;

        return string.Join("\n\n", parts);
    }
}
