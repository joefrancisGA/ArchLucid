using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Application.Findings;

/// <summary>Parses Key Vault / Secrets Manager rows from extractor <c>resources.json</c> (DX-09).</summary>
public static class SecretsLifecycleInventoryParser
{
    private static readonly string[] AzureSecretResourceTypeMarkers =
    [
        "Microsoft.KeyVault/vaults/secrets",
    ];

    private static readonly string[] AwsSecretResourceTypeMarkers =
    [
        "AWS::SecretsManager::Secret",
        "secretsmanager:secret",
    ];

    private static readonly string[] GcpSecretResourceTypeMarkers =
    [
        "secretmanager.googleapis.com/Secret",
        "google.cloud.secretmanager",
    ];

    public static IReadOnlyList<SecretsLifecycleInventoryRow> ParseFromResourcesJson(string? resourcesJson, string cloud)
    {
        if (string.IsNullOrWhiteSpace(resourcesJson))
        {
            return [];
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(resourcesJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return [];
            }

            List<SecretsLifecycleInventoryRow> rows = [];

            foreach (JsonElement row in document.RootElement.EnumerateArray())
            {
                if (row.ValueKind is not JsonValueKind.Object)
                {
                    continue;
                }

                SecretsLifecycleInventoryRow? parsed = TryParseRow(row, cloud);

                if (parsed is not null)
                {
                    rows.Add(parsed);
                }
            }

            return rows;
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static SecretsLifecycleInventoryRow? TryParseRow(JsonElement row, string cloud)
    {
        string? resourceType = ReadString(row, "resourceType") ?? ReadString(row, "ResourceType");

        if (string.IsNullOrWhiteSpace(resourceType) || !LooksLikeSecretResourceType(resourceType, cloud))
        {
            return null;
        }

        string? resourceId = ReadString(row, "resourceId") ?? ReadString(row, "ResourceId");
        string? name = ReadString(row, "name") ?? ReadString(row, "Name");

        if (string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(resourceId))
        {
            return null;
        }

        string secretName = ResolveSecretName(name, resourceId, cloud);
        string vaultName = ResolveVaultName(name, resourceId, row, cloud);

        if (string.IsNullOrWhiteSpace(secretName))
        {
            return null;
        }

        DateTimeOffset? lastRotatedUtc = ReadLastRotatedUtc(row, cloud);
        DateTimeOffset? expiryUtc = ReadExpiryUtc(row, cloud);

        if (lastRotatedUtc is null && expiryUtc is null)
        {
            return null;
        }

        string inventoryResourceId = string.IsNullOrWhiteSpace(resourceId)
            ? secretName
            : resourceId.Trim();

        return new SecretsLifecycleInventoryRow(
            secretName,
            vaultName,
            inventoryResourceId,
            cloud,
            lastRotatedUtc,
            expiryUtc);
    }

    private static bool LooksLikeSecretResourceType(string resourceType, string cloud)
    {
        string normalized = resourceType.Trim();

        return cloud switch
        {
            "Azure" => AzureSecretResourceTypeMarkers.Any(marker =>
                normalized.Contains(marker, StringComparison.OrdinalIgnoreCase)),
            "Aws" => AwsSecretResourceTypeMarkers.Any(marker =>
                normalized.Contains(marker, StringComparison.OrdinalIgnoreCase)),
            "Gcp" => GcpSecretResourceTypeMarkers.Any(marker =>
                normalized.Contains(marker, StringComparison.OrdinalIgnoreCase)),
            _ => false,
        };
    }

    private static string ResolveSecretName(string? name, string? resourceId, string cloud)
    {
        if (!string.IsNullOrWhiteSpace(name))
        {
            return name.Trim();
        }

        if (string.IsNullOrWhiteSpace(resourceId))
        {
            return string.Empty;
        }

        return cloud switch
        {
            "Azure" => ExtractAzurePathSegment(resourceId, "secrets") ?? resourceId.Trim(),
            "Aws" => ExtractAwsSecretName(resourceId) ?? resourceId.Trim(),
            "Gcp" => ExtractGcpSecretName(resourceId) ?? resourceId.Trim(),
            _ => resourceId.Trim(),
        };
    }

    private static string ResolveVaultName(string? name, string? resourceId, JsonElement row, string cloud)
    {
        string? fromProperties = ReadString(row, "vaultName")
            ?? ReadNestedString(row, "properties", "vaultName");

        if (!string.IsNullOrWhiteSpace(fromProperties))
        {
            return fromProperties.Trim();
        }

        if (string.IsNullOrWhiteSpace(resourceId))
        {
            return string.Empty;
        }

        return cloud switch
        {
            "Azure" => ExtractAzurePathSegment(resourceId, "vaults") ?? string.Empty,
            "Aws" => ExtractAwsVaultName(resourceId) ?? string.Empty,
            "Gcp" => ExtractGcpVaultName(resourceId) ?? string.Empty,
            _ => string.Empty,
        };
    }

    private static DateTimeOffset? ReadLastRotatedUtc(JsonElement row, string cloud)
    {
        DateTimeOffset? fromProperties = cloud switch
        {
            "Azure" => ReadNestedDateTime(row, "properties", "attributes", "updated")
                ?? ReadNestedDateTime(row, "properties", "updatedOn")
                ?? ReadNestedDateTime(row, "properties", "creationDate"),
            "Aws" => ReadNestedDateTime(row, "properties", "LastRotatedDate")
                ?? ReadNestedDateTime(row, "properties", "LastChangedDate")
                ?? ReadNestedDateTime(row, "properties", "lastRotatedDate")
                ?? ReadNestedDateTime(row, "properties", "lastChangedDate"),
            "Gcp" => ReadNestedDateTime(row, "properties", "updateTime")
                ?? ReadNestedDateTime(row, "properties", "createTime"),
            _ => null,
        };

        return fromProperties;
    }

    private static DateTimeOffset? ReadExpiryUtc(JsonElement row, string cloud)
    {
        return cloud switch
        {
            "Azure" => ReadNestedDateTime(row, "properties", "attributes", "exp")
                ?? ReadNestedDateTime(row, "properties", "expiresOn"),
            "Aws" => ReadNestedDateTime(row, "properties", "NextRotationDate")
                ?? ReadNestedDateTime(row, "properties", "nextRotationDate"),
            "Gcp" => ReadNestedDateTime(row, "properties", "expireTime"),
            _ => null,
        };
    }

    private static string? ExtractAzurePathSegment(string resourceId, string segmentName)
    {
        string[] parts = resourceId.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        for (int index = 0; index < parts.Length - 1; index++)
        {
            if (string.Equals(parts[index], segmentName, StringComparison.OrdinalIgnoreCase))
            {
                return parts[index + 1];
            }
        }

        return null;
    }

    private static string? ExtractAwsSecretName(string resourceId)
    {
        const string suffix = ":secret:";

        int secretIndex = resourceId.IndexOf(suffix, StringComparison.OrdinalIgnoreCase);

        if (secretIndex < 0)
        {
            return null;
        }

        string tail = resourceId[(secretIndex + suffix.Length)..];
        int dashIndex = tail.IndexOf('-', StringComparison.Ordinal);

        return dashIndex > 0 ? tail[..dashIndex] : tail;
    }

    private static string? ExtractAwsVaultName(string resourceId)
    {
        return ExtractAwsSecretName(resourceId);
    }

    private static string? ExtractGcpSecretName(string resourceId)
    {
        const string marker = "/secrets/";

        int secretIndex = resourceId.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

        if (secretIndex < 0)
        {
            return null;
        }

        return resourceId[(secretIndex + marker.Length)..].Trim('/');
    }

    private static string? ExtractGcpVaultName(string resourceId)
    {
        const string marker = "/secrets/";

        int secretIndex = resourceId.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

        if (secretIndex < 0)
        {
            return null;
        }

        string prefix = resourceId[..secretIndex];
        int slash = prefix.LastIndexOf('/');

        return slash >= 0 ? prefix[(slash + 1)..] : prefix;
    }

    private static string? ReadString(JsonElement row, string propertyName)
    {
        if (!row.TryGetProperty(propertyName, out JsonElement element))
        {
            return null;
        }

        return element.ValueKind is JsonValueKind.String ? element.GetString()?.Trim() : null;
    }

    private static string? ReadNestedString(JsonElement row, params string[] path)
    {
        if (!TryNavigate(row, path, out JsonElement element))
        {
            return null;
        }

        return element.ValueKind is JsonValueKind.String ? element.GetString()?.Trim() : null;
    }

    private static DateTimeOffset? ReadNestedDateTime(JsonElement row, params string[] path)
    {
        if (!TryNavigate(row, path, out JsonElement element))
        {
            return null;
        }

        return TryParseDateTimeOffset(element);
    }

    private static bool TryNavigate(JsonElement row, IReadOnlyList<string> path, out JsonElement element)
    {
        element = row;

        foreach (string segment in path)
        {
            if (element.ValueKind is not JsonValueKind.Object
                || !element.TryGetProperty(segment, out JsonElement next))
            {
                element = default;
                return false;
            }

            element = next;
        }

        return true;
    }

    private static DateTimeOffset? TryParseDateTimeOffset(JsonElement element)
    {
        if (element.ValueKind is JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (string.IsNullOrWhiteSpace(raw))
            {
                return null;
            }

            if (DateTimeOffset.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out DateTimeOffset parsed))
            {
                return parsed.ToUniversalTime();
            }

            if (long.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out long unixSeconds))
            {
                return DateTimeOffset.FromUnixTimeSeconds(unixSeconds);
            }
        }

        if (element.ValueKind is JsonValueKind.Number && element.TryGetInt64(out long numericUnix))
        {
            return DateTimeOffset.FromUnixTimeSeconds(numericUnix);
        }

        return null;
    }
}
