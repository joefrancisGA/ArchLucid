using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Explicit diagnostic log configuration. Null means the category evidence was unavailable or malformed.</summary>
public sealed record AzureInventoryDiagnosticLogCategory(string? Category, string? CategoryGroup, bool Enabled)
{
    public static IReadOnlyList<AzureInventoryDiagnosticLogCategory>? Read(JsonElement properties)
    {
        if (properties.ValueKind != JsonValueKind.Object
            || !properties.TryGetProperty("logs", out JsonElement logs)
            || logs.ValueKind != JsonValueKind.Array)
            return null;

        List<AzureInventoryDiagnosticLogCategory> categories = [];

        foreach (JsonElement log in logs.EnumerateArray())
        {
            if (log.ValueKind != JsonValueKind.Object
                || !log.TryGetProperty("enabled", out JsonElement enabled)
                || !AzureInventoryArmTolerantScalarReader.TryReadBooleanLiteral(enabled, out bool isEnabled))
                return null;

            string? category = ReadName(log, "category");
            string? group = ReadName(log, "categoryGroup");

            if ((category is null) == (group is null))
                return null;

            categories.Add(new(category, group, isEnabled));
        }

        return categories;
    }

    private static string? ReadName(JsonElement item, string property) =>
        item.TryGetProperty(property, out JsonElement value)
        && value.ValueKind == JsonValueKind.String
        && value.GetString() is string name
        && name.Length is > 0 and <= 128
        && name.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_')
            ? name : null;
}
