using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses normalized <c>adf-triggers.json</c> companion rows.
/// </summary>
public static class AzureInventoryAdfTriggerParser
{
    private const int MaxIdentifierLength = 512;

    private const int MaxNameLength = 260;

    public static bool TryParse(JsonElement element, out AzureInventoryAdfTriggerRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "ADF trigger row must be a JSON object.";

            return false;
        }

        string? factoryResourceId = TryReadBoundedString(element, "factoryResourceId", MaxIdentifierLength);
        string? triggerResourceId = TryReadBoundedString(element, "triggerResourceId", MaxIdentifierLength);
        string? triggerName = TryReadBoundedString(element, "triggerName", MaxNameLength);
        string? triggerType = TryReadBoundedString(element, "triggerType", MaxNameLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(factoryResourceId)
            || string.IsNullOrWhiteSpace(triggerResourceId)
            || string.IsNullOrWhiteSpace(triggerName)
            || string.IsNullOrWhiteSpace(triggerType)
            || string.IsNullOrWhiteSpace(collectionStatus))
        {
            errorMessage = "factoryResourceId, triggerResourceId, triggerName, triggerType, and collectionStatus are required.";

            return false;
        }

        if (!AzureInventoryAdfLinkedServiceCollectionStatus.IsValid(collectionStatus))
        {
            errorMessage = $"Unsupported collectionStatus '{collectionStatus}'.";

            return false;
        }

        row = new AzureInventoryAdfTriggerRow
        {
            FactoryResourceId = factoryResourceId.Trim(),
            TriggerResourceId = triggerResourceId.Trim(),
            TriggerName = triggerName.Trim(),
            TriggerType = triggerType.Trim(),
            PipelineNames = ReadStringArray(element, "pipelineNames"),
            SourceResourceId = TryReadBoundedString(element, "sourceResourceId", MaxIdentifierLength),
            SourceHost = TryReadBoundedString(element, "sourceHost", MaxNameLength),
            ScheduleRecurrence = TryReadBoundedString(element, "scheduleRecurrence", MaxNameLength),
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
