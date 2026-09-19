using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts non-secret dataset location hints from ADF <c>typeProperties</c> (AX-DE-08).
/// </summary>
public static class AzureInventoryAdfDatasetLocationExtractor
{
    private const int MaxLocationFieldLength = 256;

    public static (
        string? LocationKind,
        string? ContainerOrFilesystem,
        string? FolderPath,
        string? TableName,
        string? SchemaName) Extract(JsonElement propertiesElement)
    {
        if (propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return (null, null, null, null, null);
        }

        string? datasetType = TryReadString(propertiesElement, "type");

        if (string.IsNullOrWhiteSpace(datasetType))
        {
            return (null, null, null, null, null);
        }

        if (!propertiesElement.TryGetProperty("typeProperties", out JsonElement typePropertiesElement)
            || typePropertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return (datasetType.Trim(), null, null, null, null);
        }

        string locationKind = datasetType.Trim();
        string? containerOrFilesystem = null;
        string? folderPath = null;
        string? tableName = null;
        string? schemaName = null;

        if (typePropertiesElement.TryGetProperty("location", out JsonElement locationElement)
            && locationElement.ValueKind is JsonValueKind.Object)
        {
            containerOrFilesystem = Truncate(
                AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(locationElement, "fileName")
                ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(locationElement, "container")
                ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(locationElement, "fileSystem"));

            folderPath = Truncate(
                AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(locationElement, "folderPath")
                ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(locationElement, "fileName"));
        }

        folderPath ??= Truncate(
            AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "folderPath")
            ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "directory"));

        containerOrFilesystem ??= Truncate(
            AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "fileSystem")
            ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "container"));

        tableName = Truncate(
            AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "tableName")
            ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "table"));

        schemaName = Truncate(
            AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "schema")
            ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "schemaName"));

        return (locationKind, containerOrFilesystem, folderPath, tableName, schemaName);
    }

    private static string? Truncate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        if (trimmed.Length > MaxLocationFieldLength)
        {
            trimmed = trimmed[..MaxLocationFieldLength];
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
