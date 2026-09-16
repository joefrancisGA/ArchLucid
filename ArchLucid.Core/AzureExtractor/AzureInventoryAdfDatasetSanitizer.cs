using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Converts ARM dataset payloads into normalized companion rows without secret-bearing fields.
/// </summary>
public static class AzureInventoryAdfDatasetSanitizer
{
    public static bool TrySanitizeFromArmResource(
        string factoryResourceId,
        JsonElement datasetResource,
        out AzureInventoryAdfDatasetRow? row)
    {
        row = null;

        if (string.IsNullOrWhiteSpace(factoryResourceId)
            || datasetResource.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? datasetResourceId = TryReadString(datasetResource, "id");
        string? datasetName = TryReadString(datasetResource, "name");

        if (string.IsNullOrWhiteSpace(datasetResourceId) || string.IsNullOrWhiteSpace(datasetName))
        {
            return false;
        }

        if (!datasetResource.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            row = BuildUnresolvedRow(factoryResourceId, datasetResourceId, datasetName);

            return true;
        }

        string? linkedServiceName = TryReadLinkedServiceReferenceName(propertiesElement);

        if (string.IsNullOrWhiteSpace(linkedServiceName))
        {
            row = BuildUnresolvedRow(factoryResourceId, datasetResourceId, datasetName);

            return true;
        }

        (
            string? locationKind,
            string? containerOrFilesystem,
            string? folderPath,
            string? tableName,
            string? schemaName) = AzureInventoryAdfDatasetLocationExtractor.Extract(propertiesElement);

        row = new AzureInventoryAdfDatasetRow
        {
            FactoryResourceId = factoryResourceId.Trim(),
            DatasetResourceId = datasetResourceId.Trim(),
            DatasetName = datasetName.Trim(),
            LinkedServiceName = linkedServiceName.Trim(),
            LocationKind = locationKind,
            ContainerOrFilesystem = containerOrFilesystem,
            FolderPath = folderPath,
            TableName = tableName,
            SchemaName = schemaName,
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        return true;
    }

    private static AzureInventoryAdfDatasetRow BuildUnresolvedRow(
        string factoryResourceId,
        string datasetResourceId,
        string datasetName)
    {
        return new AzureInventoryAdfDatasetRow
        {
            FactoryResourceId = factoryResourceId.Trim(),
            DatasetResourceId = datasetResourceId.Trim(),
            DatasetName = datasetName.Trim(),
            LinkedServiceName = "_unresolved",
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.TargetUnresolved,
            WarningCode = $"{AzureInventoryAdfLinkedServiceCompletenessWarningCodes.TargetUnresolvedPrefix}{datasetName.Trim()}",
        };
    }

    private static string? TryReadLinkedServiceReferenceName(JsonElement propertiesElement)
    {
        if (!propertiesElement.TryGetProperty("linkedServiceName", out JsonElement linkedServiceElement)
            || linkedServiceElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        string? referenceName = TryReadString(linkedServiceElement, "referenceName");

        if (!AzureInventoryAdfStaticReferenceValidator.IsStaticReferenceName(referenceName))
        {
            return null;
        }

        return referenceName;
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
