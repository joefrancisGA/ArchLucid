using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses normalized <c>sql-database-principals.json</c> companion rows (SN-RT-08).
/// </summary>
public static class AzureInventorySqlDatabasePrincipalParser
{
    private const int MaxIdentifierLength = 512;

    private const int MaxNameLength = 260;

    private static readonly string[] ForbiddenPropertyNames =
    [
        "table_name",
        "tableName",
        "schema_name",
        "schemaName",
        "permission_name",
        "permissionName",
        "statement",
        "query",
    ];

    public static bool TryParse(JsonElement element, out AzureInventorySqlDatabasePrincipalRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "SQL database principal row must be a JSON object.";

            return false;
        }

        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (ForbiddenPropertyNames.Contains(property.Name.Trim(), StringComparer.OrdinalIgnoreCase))
            {
                errorMessage = $"Forbidden property '{property.Name}' is not allowed on SQL database principal rows.";

                return false;
            }
        }

        string? databaseArmId = TryReadBoundedString(element, "databaseArmId", MaxIdentifierLength);
        string? principalName = TryReadBoundedString(element, "principalName", MaxNameLength);
        string? typeDesc = TryReadBoundedString(element, "typeDesc", MaxNameLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(databaseArmId)
            || string.IsNullOrWhiteSpace(principalName)
            || string.IsNullOrWhiteSpace(typeDesc)
            || string.IsNullOrWhiteSpace(collectionStatus))
        {
            errorMessage = "databaseArmId, principalName, typeDesc, and collectionStatus are required.";

            return false;
        }

        if (!AzureInventoryAdfLinkedServiceCollectionStatus.IsValid(collectionStatus))
        {
            errorMessage = $"Unsupported collectionStatus '{collectionStatus}'.";

            return false;
        }

        if (!typeDesc.Equals("EXTERNAL_USER", StringComparison.OrdinalIgnoreCase)
            && !typeDesc.Equals("EXTERNAL_GROUP", StringComparison.OrdinalIgnoreCase))
        {
            errorMessage = $"Unsupported typeDesc '{typeDesc}'.";

            return false;
        }

        row = new AzureInventorySqlDatabasePrincipalRow
        {
            DatabaseArmId = databaseArmId.Trim(),
            PrincipalName = principalName.Trim(),
            TypeDesc = typeDesc.Trim(),
            CollectionStatus = collectionStatus.Trim(),
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
