namespace ArchLucid.Core.Authentication;

/// <summary>Normalizes API key material from configuration and inbound headers (trim + strip invisible Unicode).</summary>
public static class ApiKeyMaterialNormalizer
{
    private const string InvisibleKeyMaterialChars = "\uFEFF\u200B\u200C\u200D\u200E\u200F\u2060\u202A\u202B\u202C\u202D\u202E";

    public static string Normalize(string value)
    {
        ArgumentNullException.ThrowIfNull(value);

        string trimmed = value.Trim();

        if (trimmed.Length == 0)
            return string.Empty;

        return RemoveInvisibleKeyMaterialChars(trimmed);
    }

    private static string RemoveInvisibleKeyMaterialChars(string value)
    {
        Span<char> buffer = value.Length <= 256 ? stackalloc char[value.Length] : new char[value.Length];
        int writeIndex = 0;

        foreach (char character in value)
        {
            if (IsInvisibleKeyMaterialChar(character))
                continue;

            buffer[writeIndex++] = character;
        }

        return writeIndex == 0 ? string.Empty : new string(buffer[..writeIndex]);
    }

    private static bool IsInvisibleKeyMaterialChar(char character)
        => InvisibleKeyMaterialChars.IndexOf(character) >= 0;
}
