using ArchLucid.Core.Security;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Redacts secret-like ARM property keys before persistence or hashing.</summary>
public static class AzureExtractorSensitivePropertyRedactor
{
    public static bool IsSensitiveKey(string? propertyKey) =>
        SensitiveCredentialNameMatcher.IsSensitiveCredentialName(propertyKey);

    public static string RedactValue(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : "[REDACTED]";
}
