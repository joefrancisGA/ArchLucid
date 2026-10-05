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
        UnicodeCategory category = char.GetUnicodeCategory(character);

        if (category == UnicodeCategory.Format)
            return true;

        if (category == UnicodeCategory.Control)
            return true;

        if (category is UnicodeCategory.LineSeparator or UnicodeCategory.ParagraphSeparator)
            return true;

        // Word/HTML paste can embed no-break or thin spaces inside otherwise valid hex keys.
        return character != ' ' && category == UnicodeCategory.SpaceSeparator;
    }
}
