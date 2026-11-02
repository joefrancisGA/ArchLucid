using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses normalized <c>paas-child-associations.json</c> companion rows (AX-DE-14).
/// </summary>
public static class AzureInventoryPaasChildAssociationParser
{
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

        string? parentResourceIdRaw = TryReadString(element, "parentResourceId");
        string? childResourceIdRaw = TryReadString(element, "childResourceId");
        string? childName = TryReadBoundedString(element, "childName", MaxNameLength);
        string? childType = TryReadBoundedString(element, "childType", MaxNameLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(parentResourceIdRaw)
            || string.IsNullOrWhiteSpace(childResourceIdRaw)
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

        if (!AzureInventoryCompanionArmIdNormalizer.TryNormalize(parentResourceIdRaw, out string normalizedParentResourceId)
            || !AzureInventoryCompanionArmIdNormalizer.TryNormalize(childResourceIdRaw, out string normalizedChildResourceId))
        {
            errorMessage = "parentResourceId and childResourceId must be valid ARM identifiers.";

            return false;
        }

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

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
