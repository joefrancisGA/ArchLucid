using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Converts ARM linked-service payloads into normalized companion rows without secret-bearing fields.
/// </summary>
public static class AzureInventoryAdfLinkedServiceSanitizer
{

    public static bool TrySanitizeFromArmResource(
        string factoryResourceId,
        JsonElement linkedServiceResource,
        out AzureInventoryAdfLinkedServiceRow? row)
    {
        row = null;

        if (string.IsNullOrWhiteSpace(factoryResourceId))
        {
            return false;
        }

        if (linkedServiceResource.ValueKind is not JsonValueKind.Object)
        {
            row = BuildFailureRow(
                factoryResourceId,
                linkedServiceResourceId: null,
                linkedServiceName: null,
                linkedServiceType: null,
                AzureInventoryAdfLinkedServiceCollectionStatus.MalformedPayload,
                warningCode: null);

            return row is not null;
        }

        string? linkedServiceResourceId = TryReadString(linkedServiceResource, "id");
        string? linkedServiceName = TryReadString(linkedServiceResource, "name");

        if (string.IsNullOrWhiteSpace(linkedServiceResourceId) || string.IsNullOrWhiteSpace(linkedServiceName))
        {
            row = BuildFailureRow(
                factoryResourceId,
                linkedServiceResourceId,
                linkedServiceName,
                linkedServiceType: null,
                AzureInventoryAdfLinkedServiceCollectionStatus.MalformedPayload,
                warningCode: null);

            return row is not null;
        }

        if (!linkedServiceResource.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            row = BuildFailureRow(
                factoryResourceId,
                linkedServiceResourceId,
                linkedServiceName,
                linkedServiceType: null,
                AzureInventoryAdfLinkedServiceCollectionStatus.MalformedPayload,
                warningCode: null);

            return row is not null;
        }

        string? linkedServiceType = TryReadString(propertiesElement, "type");

        if (string.IsNullOrWhiteSpace(linkedServiceType))
        {
            row = BuildFailureRow(
                factoryResourceId,
                linkedServiceResourceId,
                linkedServiceName,
                linkedServiceType: null,
                AzureInventoryAdfLinkedServiceCollectionStatus.MalformedPayload,
                warningCode: null);

            return row is not null;
        }

        if (!AzureInventoryAdfLinkedServiceSupportedTypes.IsSupported(linkedServiceType))
        {
            row = new AzureInventoryAdfLinkedServiceRow
            {
                FactoryResourceId = factoryResourceId.Trim(),
                LinkedServiceResourceId = linkedServiceResourceId.Trim(),
                LinkedServiceName = linkedServiceName.Trim(),
                LinkedServiceType = linkedServiceType.Trim(),
                IntegrationRuntimeName = TryReadIntegrationRuntimeName(propertiesElement),
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.UnsupportedConnector,
                WarningCode = $"{AzureInventoryAdfLinkedServiceCompletenessWarningCodes.UnsupportedConnectorPrefix}{linkedServiceType}",
            };

            return true;
        }

        propertiesElement.TryGetProperty("typeProperties", out JsonElement typePropertiesElement);

        if (typePropertiesElement.ValueKind is not JsonValueKind.Object)
        {
            typePropertiesElement = default;
        }

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(typePropertiesElement, linkedServiceType);
        string? keyVaultResourceId = TryExtractKeyVaultResourceId(typePropertiesElement, linkedServiceType);

        string collectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded;
        string? warningCode = null;

        if (string.IsNullOrWhiteSpace(targetResourceId)
            && string.IsNullOrWhiteSpace(targetHost)
            && string.IsNullOrWhiteSpace(keyVaultResourceId))
        {
            collectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.TargetUnresolved;
            warningCode = $"{AzureInventoryAdfLinkedServiceCompletenessWarningCodes.TargetUnresolvedPrefix}{linkedServiceName.Trim()}";
        }

        row = new AzureInventoryAdfLinkedServiceRow
        {
            FactoryResourceId = factoryResourceId.Trim(),
            LinkedServiceResourceId = linkedServiceResourceId.Trim(),
            LinkedServiceName = linkedServiceName.Trim(),
            LinkedServiceType = linkedServiceType.Trim(),
            TargetResourceId = targetResourceId,
            TargetHost = targetHost,
            KeyVaultResourceId = keyVaultResourceId,
            IntegrationRuntimeName = TryReadIntegrationRuntimeName(propertiesElement),
            CollectionStatus = collectionStatus,
            WarningCode = warningCode,
        };

        return true;
    }

    public static AzureInventoryAdfLinkedServiceRow BuildFactoryCollectionFailureRow(
        string factoryResourceId,
        string collectionStatus,
        string? warningCode = null)
    {
        return new AzureInventoryAdfLinkedServiceRow
        {
            FactoryResourceId = factoryResourceId.Trim(),
            LinkedServiceResourceId = $"{factoryResourceId.Trim()}/linkedservices/_collection_failed",
            LinkedServiceName = "_collection_failed",
            LinkedServiceType = "CollectionFailure",
            CollectionStatus = collectionStatus,
            WarningCode = warningCode,
        };
    }

    private static AzureInventoryAdfLinkedServiceRow? BuildFailureRow(
        string factoryResourceId,
        string? linkedServiceResourceId,
        string? linkedServiceName,
        string? linkedServiceType,
        string collectionStatus,
        string? warningCode)
    {
        if (string.IsNullOrWhiteSpace(linkedServiceResourceId))
        {
            linkedServiceResourceId = $"{factoryResourceId.Trim()}/linkedservices/_malformed";
        }

        if (string.IsNullOrWhiteSpace(linkedServiceName))
        {
            linkedServiceName = "_malformed";
        }

        if (string.IsNullOrWhiteSpace(linkedServiceType))
        {
            linkedServiceType = "Malformed";
        }

        return new AzureInventoryAdfLinkedServiceRow
        {
            FactoryResourceId = factoryResourceId.Trim(),
            LinkedServiceResourceId = linkedServiceResourceId.Trim(),
            LinkedServiceName = linkedServiceName.Trim(),
            LinkedServiceType = linkedServiceType.Trim(),
            CollectionStatus = collectionStatus,
            WarningCode = warningCode,
        };
    }

    private static string? TryExtractKeyVaultResourceId(JsonElement typePropertiesElement, string linkedServiceType)
    {
        if (!linkedServiceType.Equals("AzureKeyVault", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (typePropertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        return null;
    }

    private static string? TryReadIntegrationRuntimeName(JsonElement propertiesElement)
    {
        if (!propertiesElement.TryGetProperty("connectVia", out JsonElement connectViaElement)
            || connectViaElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        return AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(connectViaElement, "referenceName");
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
