using System.Text.Json;

namespace ArchLucid.Core.Explanation;

public static partial class StructuredExplanationParser
{
    private static List<string>? TryReadStringList(JsonElement root, string propertyName)
    {
        if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, propertyName, out JsonElement arrayElement)
            || arrayElement.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        List<string> values = [];

        foreach (JsonElement item in arrayElement.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.String)
                continue;

            string? raw = item.GetString();

            if (string.IsNullOrWhiteSpace(raw))
                continue;

            values.Add(raw.Trim());
        }

        return values;
    }
}
