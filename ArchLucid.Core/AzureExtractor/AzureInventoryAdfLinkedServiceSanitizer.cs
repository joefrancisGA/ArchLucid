using System.Text.Json;
using System.Text.RegularExpressions;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Converts ARM linked-service payloads into normalized companion rows without secret-bearing fields.
/// </summary>
public static class AzureInventoryAdfLinkedServiceSanitizer
{
    private const int MaxHostLength = 253;

    private static readonly HashSet<string> SupportedLinkedServiceTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "AzureBlobStorage",
        "AzureBlobFS",
        "AzureSqlDatabase",
        "AzureSqlMI",
        "AzureSynapseAnalytics",
        "AzureDataLakeStore",
        "AzureKeyVault",
    };

    private static readonly HashSet<string> BlockedTypePropertyNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "connectionString",
        "password",
        "accountKey",
        "secretKey",
        "clientSecret",
        "servicePrincipalKey",
        "encryptedCredential",
        "sasToken",
        "accessKey",
        "apiKey",
        "token",
        "key",
        "credentials",
    };

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

        if (!SupportedLinkedServiceTypes.Contains(linkedServiceType))
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

        string? targetResourceId = TryExtractTargetResourceId(typePropertiesElement, linkedServiceType);
        string? targetHost = TryExtractTargetHost(typePropertiesElement, linkedServiceType);
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

    private static string? TryExtractTargetResourceId(JsonElement typePropertiesElement, string linkedServiceType)
    {
        if (typePropertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        string? explicitResourceId = TryReadAllowedScalar(typePropertiesElement, "resourceId");

        if (IsArmResourceId(explicitResourceId))
        {
            return explicitResourceId!.Trim();
        }

        if (linkedServiceType.Equals("AzureBlobStorage", StringComparison.OrdinalIgnoreCase))
        {
            string? serviceEndpoint = TryReadAllowedScalar(typePropertiesElement, "serviceEndpoint");

            if (IsArmResourceId(serviceEndpoint))
            {
                return serviceEndpoint!.Trim();
            }
        }

        return null;
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

        string? baseUrl = TryReadAllowedScalar(typePropertiesElement, "baseUrl");

        return TryMapKeyVaultHostToResourceId(baseUrl);
    }

    private static string? TryExtractTargetHost(JsonElement typePropertiesElement, string linkedServiceType)
    {
        if (typePropertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        if (linkedServiceType.Equals("AzureBlobStorage", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(
                TryReadHostFromUrl(TryReadAllowedScalar(typePropertiesElement, "serviceEndpoint"))
                ?? TryReadHostFromUrl(TryReadAllowedScalar(typePropertiesElement, "accountUri")));
        }

        if (linkedServiceType.Equals("AzureBlobFS", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(TryReadHostFromUrl(TryReadAllowedScalar(typePropertiesElement, "url")));
        }

        if (linkedServiceType.Equals("AzureSqlDatabase", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(TryReadAllowedScalar(typePropertiesElement, "server"));
        }

        if (linkedServiceType.Equals("AzureSqlMI", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(TryReadAllowedScalar(typePropertiesElement, "instanceName"));
        }

        if (linkedServiceType.Equals("AzureSynapseAnalytics", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(
                TryReadHostFromUrl(TryReadAllowedScalar(typePropertiesElement, "endpoint"))
                ?? TryReadAllowedScalar(typePropertiesElement, "server"));
        }

        if (linkedServiceType.Equals("AzureDataLakeStore", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(TryReadHostFromUrl(TryReadAllowedScalar(typePropertiesElement, "dataLakeStoreUri")));
        }

        if (linkedServiceType.Equals("AzureKeyVault", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(TryReadHostFromUrl(TryReadAllowedScalar(typePropertiesElement, "baseUrl")));
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

        return TryReadAllowedScalar(connectViaElement, "referenceName");
    }

    private static string? TryReadAllowedScalar(JsonElement element, string propertyName)
    {
        if (BlockedTypePropertyNames.Contains(propertyName))
        {
            return null;
        }

        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        if (value.ValueKind is JsonValueKind.Object
            && value.TryGetProperty("type", out JsonElement secureTypeElement)
            && secureTypeElement.ValueKind is JsonValueKind.String
            && secureTypeElement.GetString()?.Equals("SecureString", StringComparison.OrdinalIgnoreCase) == true)
        {
            return null;
        }

        if (value.ValueKind is not JsonValueKind.String and not JsonValueKind.Number and not JsonValueKind.True and not JsonValueKind.False)
        {
            return null;
        }

        string? text = value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');

        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        if (AzureExtractorSensitivePropertyRedactor.IsSensitiveKey(propertyName))
        {
            return null;
        }

        return text.Trim();
    }

    private static string? TryReadHostFromUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (IsArmResourceId(value))
        {
            return null;
        }

        if (!Uri.TryCreate(value.Trim(), UriKind.Absolute, out Uri? uri))
        {
            return NormalizeHost(value);
        }

        return NormalizeHost(uri.Host);
    }

    private static string? NormalizeHost(string? host)
    {
        if (string.IsNullOrWhiteSpace(host))
        {
            return null;
        }

        string trimmed = host.Trim().TrimEnd('.');

        if (trimmed.StartsWith("tcp:", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed[4..];
        }

        int commaIndex = trimmed.IndexOf(',');

        if (commaIndex >= 0)
        {
            trimmed = trimmed[..commaIndex];
        }

        if (trimmed.Length > MaxHostLength)
        {
            trimmed = trimmed[..MaxHostLength];
        }

        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed.ToLowerInvariant();
    }

    private static bool IsArmResourceId(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return value.TrimStart().StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase);
    }

    private static string? TryMapKeyVaultHostToResourceId(string? baseUrl)
    {
        string? host = NormalizeHost(TryReadHostFromUrl(baseUrl));

        if (string.IsNullOrWhiteSpace(host))
        {
            return null;
        }

        Match match = Regex.Match(host, @"^(?<vault>[a-z0-9-]+)\.vault\.(?:azure\.net|core\.windows\.net)$", RegexOptions.IgnoreCase);

        if (!match.Success)
        {
            return null;
        }

        return null;
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
