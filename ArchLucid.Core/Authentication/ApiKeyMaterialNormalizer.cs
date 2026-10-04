using System.Globalization;

namespace ArchLucid.Core.Authentication;

/// <summary>Normalizes API key material from configuration and inbound headers (trim + strip invisible Unicode).</summary>
public static class ApiKeyMaterialNormalizer
{
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
    {
        if (char.GetUnicodeCategory(character) == UnicodeCategory.Format)
            return true;

        // Word/HTML paste can embed no-break or thin spaces inside otherwise valid hex keys.
        return character != ' ' && char.GetUnicodeCategory(character) == UnicodeCategory.SpaceSeparator;
    }
}
