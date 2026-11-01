using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses normalized <c>paas-child-associations.json</c> companion rows (AX-DE-14).
/// </summary>
public static class AzureInventoryPaasChildAssociationParser
{
    private const int MaxIdentifierLength = 512;

    private const int MaxNameLength = 260;

    public static bool TryParse(JsonElement element, out AzureInventoryPaasChildAssociationRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "PaaS child association row must be a JSON object.";

            return false;
        }

        string? parentResourceId = TryReadBoundedString(element, "parentResourceId", MaxIdentifierLength);
        string? childResourceId = TryReadBoundedString(element, "childResourceId", MaxIdentifierLength);
        string? childName = TryReadBoundedString(element, "childName", MaxNameLength);
        string? childType = TryReadBoundedString(element, "childType", MaxNameLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(parentResourceId)
            || string.IsNullOrWhiteSpace(childResourceId)
            || string.IsNullOrWhiteSpace(childName)
            || string.IsNullOrWhiteSpace(childType)
            || string.IsNullOrWhiteSpace(collectionStatus))
        {
            errorMessage = "parentResourceId, childResourceId, childName, childType, and collectionStatus are required.";

            return false;
        }

        if (!AzureInventoryAdfLinkedServiceCollectionStatus.IsValid(collectionStatus))
        {
            errorMessage = $"Unsupported collectionStatus '{collectionStatus}'.";

            return false;
        }

        string normalizedParentResourceId = NormalizeCompanionArmId(parentResourceId);
        string normalizedChildResourceId = NormalizeCompanionArmId(childResourceId);

        row = new AzureInventoryPaasChildAssociationRow
        {
            ParentResourceId = normalizedParentResourceId,
            ChildResourceId = normalizedChildResourceId,
            ChildName = childName.Trim(),
            ChildType = childType.Trim(),
            AssociationType = TryReadBoundedString(element, "associationType", MaxNameLength)
                ?? AzureInventoryPaasChildAssociationTypes.PaasChild,
            CollectionStatus = collectionStatus.Trim(),
            WarningCode = TryReadBoundedString(element, "warningCode", MaxNameLength),
        };

        return true;
    }

    private static string? TryReadBoundedString(JsonElement element, string propertyName, int maxLength)
    {
        string? value = TryReadString(element, propertyName);

        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        if (trimmed.Length > maxLength)
        {
            trimmed = trimmed[..maxLength];
        }

        return trimmed;
    }

    private static string NormalizeCompanionArmId(string armId)
    {
        if (string.IsNullOrWhiteSpace(armId))
        {
            return string.Empty;
        }

        string working = armId.Trim();

        const int maxPercentDecodePasses = 8;

        for (int pass = 0; pass < maxPercentDecodePasses && working.Contains('%'); pass++)
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

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
