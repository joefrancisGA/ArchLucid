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

        string withoutInvisible = RemoveInvisibleKeyMaterialChars(trimmed);

        if (withoutInvisible.Length == 0)
            return string.Empty;

        if (IsAsciiHexKeyMaterial(withoutInvisible))
            return withoutInvisible.ToLowerInvariant();

        return withoutInvisible;
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

        if (category == UnicodeCategory.NonSpacingMark)
            return true;

        if (category == UnicodeCategory.Control)
            return true;

        if (category is UnicodeCategory.LineSeparator or UnicodeCategory.ParagraphSeparator)
            return true;

        // Hangul filler letters paste invisibly between visible key bytes (IME/Word paste paths).
        if (character is '\u115F' or '\u1160' or '\u3164' or '\uFFA0')
            return true;

        // Braille blank and object-replacement glyphs paste invisibly in spreadsheet/key vault exports.
        if (character is '\u2800' or '\uFFFC')
            return true;

        // Combining grapheme joiner pastes invisibly between ASCII key bytes (Word/browser copy paths).
        if (character == '\u034F')
            return true;

        // Word/HTML paste can embed no-break or thin spaces inside otherwise valid hex keys.
        return character != ' ' && category == UnicodeCategory.SpaceSeparator;
    }

    private static bool IsAsciiHexKeyMaterial(string value)
    {
        if (value.Length < ApiKeyMaterialGenerator.DefaultKeyByteLength)
            return false;

        foreach (char character in value)
        {
            if (!char.IsAsciiHexDigit(character))
                return false;
        }

        return true;
    }
}
