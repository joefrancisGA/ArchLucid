using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses normalized <c>adf-dataflows.json</c> companion rows.
/// </summary>
public static class AzureInventoryAdfDataflowParser
{
    private const int MaxIdentifierLength = 512;

    private const int MaxNameLength = 260;

    public static bool TryParse(JsonElement element, out AzureInventoryAdfDataflowRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "ADF dataflow row must be a JSON object.";

            return false;
        }

        string? factoryResourceId = TryReadBoundedString(element, "factoryResourceId", MaxIdentifierLength);
        string? dataflowResourceId = TryReadBoundedString(element, "dataflowResourceId", MaxIdentifierLength);
        string? dataflowName = TryReadBoundedString(element, "dataflowName", MaxNameLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(factoryResourceId)
            || string.IsNullOrWhiteSpace(dataflowResourceId)
            || string.IsNullOrWhiteSpace(dataflowName)
            || string.IsNullOrWhiteSpace(collectionStatus))
        {
            errorMessage = "factoryResourceId, dataflowResourceId, dataflowName, and collectionStatus are required.";

            return false;
        }

        if (!AzureInventoryAdfLinkedServiceCollectionStatus.IsValid(collectionStatus))
        {
            errorMessage = $"Unsupported collectionStatus '{collectionStatus}'.";

            return false;
        }

        row = new AzureInventoryAdfDataflowRow
        {
            FactoryResourceId = factoryResourceId.Trim(),
            DataflowResourceId = dataflowResourceId.Trim(),
            DataflowName = dataflowName.Trim(),
            SourceLinkedServiceNames = ReadStringArray(element, "sourceLinkedServiceNames"),
            SinkLinkedServiceNames = ReadStringArray(element, "sinkLinkedServiceNames"),
            CollectionStatus = collectionStatus.Trim(),
            WarningCode = TryReadBoundedString(element, "warningCode", MaxNameLength),
        };

        return true;
    }

    private static IReadOnlyList<string> ReadStringArray(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement arrayElement)
            || arrayElement.ValueKind is not JsonValueKind.Array)
        {
            return [];
        }

        List<string> values = [];

        foreach (JsonElement item in arrayElement.EnumerateArray())
        {
            if (item.ValueKind is not JsonValueKind.String)
            {
                continue;
            }

            string? value = item.GetString();

            if (!string.IsNullOrWhiteSpace(value))
            {
                values.Add(value.Trim());
            }
        }

        return values;
    }

    private static string? TryReadBoundedString(JsonElement element, string propertyName, int maxLength)
    {
        string? value = TryReadString(element, propertyName);

        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        if (trimmed.Length > maxLength)
        {
            trimmed = trimmed[..maxLength];
        }

        return trimmed;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
