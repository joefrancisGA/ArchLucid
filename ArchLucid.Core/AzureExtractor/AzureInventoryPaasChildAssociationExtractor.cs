using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts PaaS child rows from SQL, Cosmos, and storage ARM payloads (AX-DE-14).
/// </summary>
public static class AzureInventoryPaasChildAssociationExtractor
{
    public static bool TryExtractChild(
        string parentResourceId,
        JsonElement childResource,
        string childType,
        out AzureInventoryPaasChildAssociationRow? row)
    {
        row = null;

        if (string.IsNullOrWhiteSpace(parentResourceId)
            || childResource.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? childResourceId = TryReadString(childResource, "id");
        string? childName = TryReadString(childResource, "name");

        if (string.IsNullOrWhiteSpace(childResourceId) || string.IsNullOrWhiteSpace(childName))
        {
            return false;
        }

        row = new AzureInventoryPaasChildAssociationRow
        {
            ParentResourceId = NormalizeCompanionArmId(parentResourceId),
            ChildResourceId = NormalizeCompanionArmId(childResourceId),
            ChildName = childName.Trim(),
            ChildType = childType,
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        return true;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : null;
    }

    private static string NormalizeCompanionArmId(string armId)
    {
        if (string.IsNullOrWhiteSpace(armId))
        {
            return string.Empty;
        }

        string working = armId.Trim();

        const int maxPercentDecodePasses = 8;

        for (int pass = 0; pass < maxPercentDecodePasses && working.Contains('%', StringComparison.Ordinal); pass++)
        {
            string decoded = Uri.UnescapeDataString(working);

            if (string.Equals(decoded, working, StringComparison.Ordinal))
            {
                break;
            }

            working = decoded;
        }

        return ArmResourceIdNormalizer.Normalize(working);
    }
}
