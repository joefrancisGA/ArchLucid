namespace ArchLucid.Core.Authentication;

/// <summary>Normalizes API key material from configuration and inbound headers (trim + UTF-8 BOM strip).</summary>
public static class ApiKeyMaterialNormalizer
{
    private const string InvisibleKeyMaterialChars = "\uFEFF\u200B\u200C\u200D\u2060";

    public static string Normalize(string value)
    {
        ArgumentNullException.ThrowIfNull(value);

        string trimmed = TrimInvisibleKeyMaterial(value.Trim());

        return trimmed.Length == 0 ? string.Empty : trimmed;
    }

    private static string TrimInvisibleKeyMaterial(string value)
    {
        int start = 0;
        int end = value.Length;

        while (start < end && IsInvisibleKeyMaterialChar(value[start]))
            start++;

        while (end > start && IsInvisibleKeyMaterialChar(value[end - 1]))
            end--;

        return value[start..end];
    }

    private static bool IsInvisibleKeyMaterialChar(char character)
        => InvisibleKeyMaterialChars.IndexOf(character) >= 0;
}
