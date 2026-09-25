using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Reads the protected VM or VMSS ARM id from a restore point collection (NR-03).</summary>
public static class AzureInventoryRestorePointCollectionSourceParser
{
    public static string? Parse(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (properties.TryGetValue(
                InventoryDiagramParentAttachmentPropertyKeys.RestorePointSourceArmId,
                out string? hydrated)
            && !string.IsNullOrWhiteSpace(hydrated))
        {
            return ArmResourceIdNormalizer.Normalize(hydrated);
        }

        if (properties.TryGetValue("source.id", out string? sourceId)
            && !string.IsNullOrWhiteSpace(sourceId))
        {
            return ArmResourceIdNormalizer.Normalize(sourceId);
        }

        if (properties.TryGetValue("source", out string? sourceJson)
            && !string.IsNullOrWhiteSpace(sourceJson)
            && sourceJson.TrimStart().StartsWith("{", StringComparison.Ordinal))
        {
            return TryReadSourceArmIdFromJson(sourceJson);
        }

        return null;
    }

    private static string? TryReadSourceArmIdFromJson(string sourceJson)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(sourceJson);

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
