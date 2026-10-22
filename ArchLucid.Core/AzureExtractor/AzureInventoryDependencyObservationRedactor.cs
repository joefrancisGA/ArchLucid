namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Rejects companion rows that carry query payloads or SQL text (SN-RT-06).
/// </summary>
public static class AzureInventoryDependencyObservationRedactor
{
    private static readonly string[] ForbiddenPropertyNames =
    [
        "statement",
        "query",
        "queryText",
        "sqlStatement",
        "sqlText",
        "table_name",
        "tableName",
        "rowData",
        "row_data",
        "payload",
        "message",
        "data",
    ];

    public static bool ContainsForbiddenProperty(string propertyName)
    {
        if (string.IsNullOrWhiteSpace(propertyName))
        {
            return false;
        }

        return ForbiddenPropertyNames.Contains(propertyName.Trim(), StringComparer.OrdinalIgnoreCase);
    }

    public static bool ShouldRejectValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string normalized = value.Trim();

        return normalized.Contains("SELECT ", StringComparison.OrdinalIgnoreCase)
               || normalized.Contains("INSERT ", StringComparison.OrdinalIgnoreCase)
               || normalized.Contains("UPDATE ", StringComparison.OrdinalIgnoreCase)
               || normalized.Contains("DELETE ", StringComparison.OrdinalIgnoreCase)
               || normalized.Contains("Password=", StringComparison.OrdinalIgnoreCase)
               || normalized.Contains("SharedAccessKey=", StringComparison.OrdinalIgnoreCase);
    }
}
