using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Reads cited parent and external targets for access connector resources (NR-03).</summary>
public static class AzureInventoryAccessConnectorTargetParser
{
    public static string? ParseParentArmId(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (properties.TryGetValue(
                InventoryDiagramParentAttachmentPropertyKeys.AccessConnectorParentArmId,
                out string? hydrated)
            && !string.IsNullOrWhiteSpace(hydrated))
        {
            return ArmResourceIdNormalizer.Normalize(hydrated);
        }

        if (properties.TryGetValue("arm.parentId", out string? parentId)
            && !string.IsNullOrWhiteSpace(parentId))
        {
            return ArmResourceIdNormalizer.Normalize(parentId);
        }

        return null;
    }

    public static string? ParseExternalTargetArmId(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (properties.TryGetValue(
                InventoryDiagramParentAttachmentPropertyKeys.ExternalTargetArmId,
                out string? hydrated)
            && !string.IsNullOrWhiteSpace(hydrated))
        {
            return ArmResourceIdNormalizer.Normalize(hydrated);
        }

        foreach (string key in new[]
                 {
                     "targetResourceId",
                     "targetResourceId.id",
                     "externalResourceId",
                     "externalResourceId.id",
                     "storageAccountResourceId",
                     "storageAccountId",
                 })
        {
            if (properties.TryGetValue(key, out string? value)
                && !string.IsNullOrWhiteSpace(value)
                && value.StartsWith("/", StringComparison.Ordinal))
            {
                return ArmResourceIdNormalizer.Normalize(value);
            }
        }

        if (properties.TryGetValue("target", out string? targetJson)
            && !string.IsNullOrWhiteSpace(targetJson)
            && targetJson.TrimStart().StartsWith("{", StringComparison.Ordinal))
        {
            return TryReadArmIdFromJson(targetJson);
        }

        return null;
    }

    private static string? TryReadArmIdFromJson(string json)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(json);

            if (document.RootElement.ValueKind is not JsonValueKind.Object)
            {
                return null;
            }

            if (document.RootElement.TryGetProperty("id", out JsonElement idElement)
                && idElement.ValueKind is JsonValueKind.String)
            {
                string? id = idElement.GetString();

                return string.IsNullOrWhiteSpace(id) ? null : ArmResourceIdNormalizer.Normalize(id);
            }
        }
        catch (JsonException)
        {
        }

        return null;
    }
}
