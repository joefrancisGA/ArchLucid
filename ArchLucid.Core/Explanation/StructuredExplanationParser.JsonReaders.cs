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
            if (arrayElement.ValueKind == JsonValueKind.Object)
            {
                string? objectEntry = TryReadStringListEntry(arrayElement);

                return string.IsNullOrWhiteSpace(objectEntry) ? null : [objectEntry.Trim()];
            }

            if (RunExplanationAggregateJsonReader.TryReadNonEmptyTextToken(arrayElement, out string? scalar)
                && !string.IsNullOrWhiteSpace(scalar))
            {
                return [scalar.Trim()];
            }

            return null;
        }

        List<string> values = [];

        foreach (JsonElement item in arrayElement.EnumerateArray())
            CollectStringListEntries(item, values);

        return values;
    }

    private static void CollectStringListEntries(JsonElement item, List<string> values)
    {
        if (item.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement inner in item.EnumerateArray())
                CollectStringListEntries(inner, values);

            return;
        }

        string? raw = TryReadStringListEntry(item);

        if (string.IsNullOrWhiteSpace(raw))
            return;

        values.Add(raw.Trim());
    }

    private static string? TryReadStringListEntry(JsonElement item)
    {
        if (item.ValueKind == JsonValueKind.String)
            return item.GetString();

        if (item.ValueKind == JsonValueKind.Object)
            return TryReadObjectStringProperty(item, "id", "text");

        return RunExplanationAggregateJsonReader.TryReadNonEmptyTextToken(item, out string? scalar)
            ? scalar
            : null;
    }

    private static string? TryReadObjectStringProperty(JsonElement item, params ReadOnlySpan<string> propertyNames)
    {
        foreach (string propertyName in propertyNames)
        {
            if (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(item, propertyName, out JsonElement element)
                && RunExplanationAggregateJsonReader.TryReadNonEmptyTextToken(element, out string? value)
                && !string.IsNullOrWhiteSpace(value))
            {
                return value;
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
        {
            return RunExplanationAggregateJsonReader.TryReadNonEmptyTextToken(reasoningElement, out string? scalar)
                ? scalar
                : null;
        }

        List<string> parts = [];

        foreach (JsonElement item in reasoningElement.EnumerateArray())
            CollectReasoningParts(item, parts);

        if (parts.Count == 0)
            return null;

        return string.Join("\n\n", parts);
    }

    private static void CollectReasoningParts(JsonElement item, List<string> parts)
    {
        if (item.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement inner in item.EnumerateArray())
                CollectReasoningParts(inner, parts);

            return;
        }

        string? part = item.ValueKind switch
        {
            JsonValueKind.String => item.GetString(),
            JsonValueKind.Object => TryReadObjectStringProperty(item, "id", "text"),
            _ => RunExplanationAggregateJsonReader.TryReadNonEmptyTextToken(item, out string? scalar)
                ? scalar
                : null,
        };

        if (string.IsNullOrWhiteSpace(part))
            return;

        parts.Add(part.Trim());
    }
}
