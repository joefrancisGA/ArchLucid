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
            return TryResolveArmReferenceValue(hydrated);
        }

        if (properties.TryGetValue("source.id", out string? sourceId)
            && !string.IsNullOrWhiteSpace(sourceId))
        {
            return TryResolveArmReferenceValue(sourceId);
        }

        if (properties.TryGetValue("source", out string? sourceJson)
            && !string.IsNullOrWhiteSpace(sourceJson))
        {
            return TryResolveArmReferenceValue(sourceJson);
        }

        return null;
    }

    private static string? TryResolveArmReferenceValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        // Parse raw JSON first. Percent-decoding the whole blob first would rewrite sibling
        // escapes such as %22 and corrupt the document before the id can be read.
        if (trimmed.StartsWith("{", StringComparison.Ordinal))
        {
            return TryReadArmIdFromJson(trimmed);
        }

        if (!ArmResourceIdNormalizer.TryDecodePercentEncoded(trimmed, out string working))
        {
            return null;
        }

        if (working.StartsWith("{", StringComparison.Ordinal))
        {
            return TryReadArmIdFromJson(working);
        }

        if (!working.StartsWith("/", StringComparison.Ordinal)
            || !working.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return ArmResourceIdNormalizer.Normalize(working);
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
                return TryResolveArmReferenceValue(idElement.GetString());
            }
        }
        catch (JsonException)
        {
        }

        return null;
    }
}
