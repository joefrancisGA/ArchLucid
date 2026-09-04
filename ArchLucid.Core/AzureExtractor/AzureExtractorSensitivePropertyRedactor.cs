namespace ArchLucid.Core.AzureExtractor;

/// <summary>Redacts secret-like ARM property keys before persistence or hashing.</summary>
public static class AzureExtractorSensitivePropertyRedactor
{
    private static readonly string[] SensitiveKeyFragments =
    [
        "secret",
        "password",
        "connectionstring",
        "privatekey",
        "certificate",
        "accesskey",
        "accountkey",
        "clientsecret",
        "primarykey",
        "secondarykey",
    ];

    public static bool IsSensitiveKey(string? propertyKey)
    {
        if (string.IsNullOrWhiteSpace(propertyKey))
            return false;

        string normalized = propertyKey.Replace("-", string.Empty, StringComparison.Ordinal)
            .Replace("_", string.Empty, StringComparison.Ordinal)
            .ToLowerInvariant();

        foreach (string fragment in SensitiveKeyFragments)
        {
            if (normalized.Contains(fragment, StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    public static string RedactValue(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : "[REDACTED]";
}
