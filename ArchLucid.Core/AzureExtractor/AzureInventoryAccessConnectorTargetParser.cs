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

        if (properties.TryGetValue("arm.parentId", out string? parentId))
        {
            return TryResolveArmReferenceValue(parentId);
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
            if (properties.TryGetValue(key, out string? value))
            {
                string? resolved = TryResolveArmReferenceValue(value);

                if (!string.IsNullOrWhiteSpace(resolved))
                {
                    return resolved;
                }
            }
        }

        if (properties.TryGetValue("target", out string? targetJson))
        {
            return TryResolveArmReferenceValue(targetJson);
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

        if (trimmed.StartsWith("{", StringComparison.Ordinal))
        {
            return TryReadArmIdFromJson(trimmed);
        }

        if (!trimmed.StartsWith("/", StringComparison.Ordinal)
            || !trimmed.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return ArmResourceIdNormalizer.Normalize(trimmed);
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
