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
        IReadOnlyDictionary<string, string>? datasetLinkedServiceNames,
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

        List<string> sourceLinkedServiceNames =
            ExtractLinkedServiceNames(typePropertiesElement, "sources", datasetLinkedServiceNames);
        List<string> sinkLinkedServiceNames =
            ExtractLinkedServiceNames(typePropertiesElement, "sinks", datasetLinkedServiceNames);

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

    public static bool TryExtractFromArmResource(
        string factoryResourceId,
        JsonElement dataflowResource,
        out AzureInventoryAdfDataflowRow? row)
    {
        return TryExtractFromArmResource(factoryResourceId, dataflowResource, null, out row);
    }

    private static List<string> ExtractLinkedServiceNames(
        JsonElement typePropertiesElement,
        string collectionPropertyName,
        IReadOnlyDictionary<string, string>? datasetLinkedServiceNames)
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

            string? linkedServiceName = TryReadLinkedServiceReferenceName(item);

            if (string.IsNullOrWhiteSpace(linkedServiceName)
                && item.TryGetProperty("dataset", out JsonElement datasetElement)
                && datasetElement.ValueKind is JsonValueKind.Object)
            {
                linkedServiceName = TryReadLinkedServiceReferenceName(datasetElement);

                if (string.IsNullOrWhiteSpace(linkedServiceName)
                    && datasetLinkedServiceNames is not null)
                {
                    string? datasetName = TryReadString(datasetElement, "referenceName");
                    if (!string.IsNullOrWhiteSpace(datasetName))
                    {
                        datasetLinkedServiceNames.TryGetValue(datasetName.Trim(), out linkedServiceName);
                    }
                }
            }

            if (AzureInventoryAdfStaticReferenceValidator.IsStaticReferenceName(linkedServiceName))
            {
                linkedServiceNames.Add(linkedServiceName!.Trim());
            }
        }

        return linkedServiceNames.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static string? TryReadLinkedServiceReferenceName(JsonElement element)
    {
        if (!element.TryGetProperty("linkedService", out JsonElement linkedServiceElement)
            || linkedServiceElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        return TryReadString(linkedServiceElement, "referenceName");
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
