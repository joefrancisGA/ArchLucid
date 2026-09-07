using System.IO.Compression;
using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Reads schema v1/v2 inventory payloads from Azure extractor ZIP archives.</summary>
public static class AzureExtractorPackageInventoryReader
{
    private static readonly JsonSerializerOptions SerializerOptions =
        new() { PropertyNameCaseInsensitive = true };

    public static AzureExtractorPackageInventoryReadResult TryReadFromZip(Stream zipStream)
    {
        ArgumentNullException.ThrowIfNull(zipStream);

        try
        {
            using ZipArchive archive = new(zipStream, ZipArchiveMode.Read, leaveOpen: true);

            List<AzureExtractorExtendedResourceRow> resources = ReadResources(archive);
            List<JsonElement> roleAssignments = ReadOptionalArray(archive, AzureExtractorPackageZipEntryNames.RoleAssignments);
            List<JsonElement> diagnosticSettings = ReadOptionalArray(archive, AzureExtractorPackageZipEntryNames.DiagnosticSettings);
            List<JsonElement> networkAssociations = ReadOptionalArray(archive, AzureExtractorPackageZipEntryNames.NetworkAssociations);
            List<JsonElement> policyAssignments = ReadOptionalArray(archive, AzureExtractorPackageZipEntryNames.PolicyAssignments);
            List<JsonElement> defenderSummary = ReadOptionalArray(archive, AzureExtractorPackageZipEntryNames.DefenderSummary);

            return new AzureExtractorPackageInventoryReadResult
            {
                Resources = resources,
                RoleAssignments = roleAssignments,
                DiagnosticSettings = diagnosticSettings,
                NetworkAssociations = networkAssociations,
                PolicyAssignments = policyAssignments,
                DefenderSummary = defenderSummary,
            };
        }
        catch (JsonException ex)
        {
            return AzureExtractorPackageInventoryReadResult.Failed(ex.Message);
        }
        catch (InvalidDataException ex)
        {
            return AzureExtractorPackageInventoryReadResult.Failed(ex.Message);
        }
    }

    private static List<AzureExtractorExtendedResourceRow> ReadResources(ZipArchive archive)
    {
        ZipArchiveEntry? entry = FindEntry(archive, AzureExtractorPackageZipEntryNames.Resources);

        if (entry is null)
            return [];

        using Stream stream = entry.Open();
        using JsonDocument document = JsonDocument.Parse(stream);

        if (document.RootElement.ValueKind is not JsonValueKind.Array)
            return [];

        List<AzureExtractorExtendedResourceRow> rows = [];

        foreach (JsonElement row in document.RootElement.EnumerateArray())
        {
            if (row.ValueKind is not JsonValueKind.Object)
                continue;

            AzureExtractorExtendedResourceRow? mapped = MapResourceRow(row);

            if (mapped is not null)
                rows.Add(mapped);
        }

        return rows;
    }

    private static AzureExtractorExtendedResourceRow? MapResourceRow(JsonElement row)
    {
        string? azureResourceId = TryReadString(row, "resourceId") ?? TryReadString(row, "id");

        if (string.IsNullOrWhiteSpace(azureResourceId))
            azureResourceId = TryReadString(row, "name");

        string? resourceType = TryReadString(row, "resourceType") ?? TryReadString(row, "type");

        if (string.IsNullOrWhiteSpace(azureResourceId) || string.IsNullOrWhiteSpace(resourceType))
            return null;

        string name = TryReadString(row, "name") ?? azureResourceId.Split('/').LastOrDefault() ?? azureResourceId;
        string? location = TryReadString(row, "location");
        string? resourceGroup = TryReadString(row, "resourceGroup") ?? ExtractResourceGroup(azureResourceId);
        string? skuName = ExtractSku(row);
        IReadOnlyDictionary<string, string> tags = ReadStringDictionary(row, "tags");
        IReadOnlyDictionary<string, string> properties = ReadProperties(row);
        bool isUnknown = row.TryGetProperty("isUnknownType", out JsonElement unknownFlag)
                         && unknownFlag.ValueKind is JsonValueKind.True;

        return new AzureExtractorExtendedResourceRow
        {
            AzureResourceId = azureResourceId.Trim(),
            ResourceType = resourceType.Trim(),
            Name = name.Trim(),
            Location = location,
            ResourceGroup = resourceGroup,
            SkuName = skuName,
            Tags = tags,
            Properties = properties,
            IsUnknownType = isUnknown,
        };
    }

    private static List<JsonElement> ReadOptionalArray(ZipArchive archive, string entryName)
    {
        ZipArchiveEntry? entry = FindEntry(archive, entryName);

        if (entry is null)
            return [];

        using Stream stream = entry.Open();
        using JsonDocument document = JsonDocument.Parse(stream);

        if (document.RootElement.ValueKind is not JsonValueKind.Array)
            return [];

        return document.RootElement.EnumerateArray().Select(static element => element.Clone()).ToList();
    }

    private static ZipArchiveEntry? FindEntry(ZipArchive archive, string entryName) =>
        archive.GetEntry(entryName)
        ?? archive.Entries.FirstOrDefault(entry => entryName.Equals(entry.Name, StringComparison.OrdinalIgnoreCase));

    private static string? ExtractResourceGroup(string azureResourceId)
    {
        string[] parts = azureResourceId.Split('/', StringSplitOptions.RemoveEmptyEntries);

        for (int index = 0; index < parts.Length - 1; index++)
        {
            if (parts[index].Equals("resourceGroups", StringComparison.OrdinalIgnoreCase))
                return parts[index + 1];
        }

        return null;
    }

    private static string? ExtractSku(JsonElement row)
    {
        if (!row.TryGetProperty("sku", out JsonElement sku))
            return null;

        if (sku.ValueKind is JsonValueKind.String)
            return sku.GetString();

        if (sku.ValueKind is JsonValueKind.Object && sku.TryGetProperty("name", out JsonElement skuName))
            return skuName.GetString();

        return null;
    }

    private static IReadOnlyDictionary<string, string> ReadStringDictionary(JsonElement row, string propertyName)
    {
        if (!row.TryGetProperty(propertyName, out JsonElement dictionary) || dictionary.ValueKind is not JsonValueKind.Object)
            return new Dictionary<string, string>();

        Dictionary<string, string> values = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonProperty property in dictionary.EnumerateObject())
        {
            if (property.Value.ValueKind is JsonValueKind.String)
                values[property.Name] = property.Value.GetString() ?? string.Empty;
        }

        return values;
    }

    private static IReadOnlyDictionary<string, string> ReadProperties(JsonElement row)
    {
        if (!row.TryGetProperty("properties", out JsonElement properties) || properties.ValueKind is not JsonValueKind.Object)
            return new Dictionary<string, string>();

        Dictionary<string, string> values = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonProperty property in properties.EnumerateObject())
        {
            string serialized = property.Value.ValueKind switch
            {
                JsonValueKind.String => property.Value.GetString() ?? string.Empty,
                JsonValueKind.Number => property.Value.GetRawText(),
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                JsonValueKind.Null => string.Empty,
                JsonValueKind.Object or JsonValueKind.Array =>
                    AzureExtractorSensitivePropertyRedactor.RedactStructuredJson(property.Value),
                _ => property.Value.GetRawText(),
            };

            if (property.Value.ValueKind is JsonValueKind.String
                    or JsonValueKind.Number
                    or JsonValueKind.True
                    or JsonValueKind.False
                && AzureExtractorSensitivePropertyRedactor.IsSensitiveKey(property.Name))
                serialized = AzureExtractorSensitivePropertyRedactor.RedactValue(serialized);

            if (serialized.Length > 4000)
                serialized = serialized[..4000];

            values[property.Name] = serialized;
        }

        return values;
    }

    private static string? TryReadString(JsonElement row, string propertyName)
    {
        if (!row.TryGetProperty(propertyName, out JsonElement value))
            return null;

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}

public sealed class AzureExtractorPackageInventoryReadResult
{
    public bool Succeeded
    {
        get;
        init;
    } = true;

    public string? Error
    {
        get;
        init;
    }

    public IReadOnlyList<AzureExtractorExtendedResourceRow> Resources
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> RoleAssignments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> DiagnosticSettings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> NetworkAssociations
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> PolicyAssignments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> DefenderSummary
    {
        get;
        init;
    } = [];

    public static AzureExtractorPackageInventoryReadResult Failed(string error) =>
        new() { Succeeded = false, Error = error };
}
