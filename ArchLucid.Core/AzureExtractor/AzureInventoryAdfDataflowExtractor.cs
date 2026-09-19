using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts static linked-service references from ADF mapping data flow payloads.
/// </summary>
public static class AzureInventoryAdfDataflowExtractor
{
    public static bool TryExtractFromArmResource(
        string factoryResourceId,
        JsonElement dataflowResource,
        out AzureInventoryAdfDataflowRow? row)
    {
        row = null;

        if (string.IsNullOrWhiteSpace(factoryResourceId)
            || dataflowResource.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? dataflowResourceId = TryReadString(dataflowResource, "id");
        string? dataflowName = TryReadString(dataflowResource, "name");

        if (string.IsNullOrWhiteSpace(dataflowResourceId) || string.IsNullOrWhiteSpace(dataflowName))
        {
            return false;
        }

        if (!dataflowResource.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        propertiesElement.TryGetProperty("typeProperties", out JsonElement typePropertiesElement);

        if (typePropertiesElement.ValueKind is not JsonValueKind.Object)
        {
            typePropertiesElement = default;
        }

        List<string> sourceLinkedServiceNames = ExtractLinkedServiceNames(typePropertiesElement, "sources");
        List<string> sinkLinkedServiceNames = ExtractLinkedServiceNames(typePropertiesElement, "sinks");

        row = new AzureInventoryAdfDataflowRow
        {
            FactoryResourceId = factoryResourceId.Trim(),
            DataflowResourceId = dataflowResourceId.Trim(),
            DataflowName = dataflowName.Trim(),
            SourceLinkedServiceNames = sourceLinkedServiceNames,
            SinkLinkedServiceNames = sinkLinkedServiceNames,
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        return true;
    }

    private static List<string> ExtractLinkedServiceNames(JsonElement typePropertiesElement, string collectionPropertyName)
    {
        List<string> linkedServiceNames = [];

        if (typePropertiesElement.ValueKind is not JsonValueKind.Object
            || !typePropertiesElement.TryGetProperty(collectionPropertyName, out JsonElement collectionElement)
            || collectionElement.ValueKind is not JsonValueKind.Array)
        {
            return linkedServiceNames;
        }

        foreach (JsonElement item in collectionElement.EnumerateArray())
        {
            if (item.ValueKind is not JsonValueKind.Object)
            {
                continue;
            }

            if (!item.TryGetProperty("dataset", out JsonElement datasetElement)
                || datasetElement.ValueKind is not JsonValueKind.Object
                || !datasetElement.TryGetProperty("linkedService", out JsonElement linkedServiceElement)
                || linkedServiceElement.ValueKind is not JsonValueKind.Object)
            {
                continue;
            }

            string? referenceName = TryReadString(linkedServiceElement, "referenceName");

            if (AzureInventoryAdfStaticReferenceValidator.IsStaticReferenceName(referenceName))
            {
                linkedServiceNames.Add(referenceName!.Trim());
            }
        }

        return linkedServiceNames.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
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
