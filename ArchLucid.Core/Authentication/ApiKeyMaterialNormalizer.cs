using System.Globalization;
using System.Text;

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

        foreach (Rune rune in value.EnumerateRunes())
        {
            if (IsInvisibleKeyMaterialRune(rune))
                continue;

            writeIndex += rune.EncodeToUtf16(buffer[writeIndex..]);
        }

        return writeIndex == 0 ? string.Empty : new string(buffer[..writeIndex]);
    }

    private static bool IsInvisibleKeyMaterialRune(Rune rune)
    {
        if (rune.IsBmp)
            return IsInvisibleKeyMaterialBmpChar((char)rune.Value);

        UnicodeCategory supplementaryCategory = Rune.GetUnicodeCategory(rune);

        if (rune.Value == 0xFFFD)
            return true;

        if (supplementaryCategory is UnicodeCategory.Format
            or UnicodeCategory.NonSpacingMark
            or UnicodeCategory.SpacingCombiningMark
            or UnicodeCategory.EnclosingMark)
            return true;

        return false;
    }

    private static bool IsInvisibleKeyMaterialBmpChar(char character)
    {
        UnicodeCategory category = char.GetUnicodeCategory(character);

        if (category == UnicodeCategory.Format)
            return true;

        if (category is UnicodeCategory.NonSpacingMark
            or UnicodeCategory.SpacingCombiningMark
            or UnicodeCategory.EnclosingMark)
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

        // Ill-formed UTF-16 paste and decoder replacement glyphs break config/header parity.
        if (character == '\uFFFD')
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
