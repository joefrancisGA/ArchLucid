using System.Globalization;
using System.Text;

namespace ArchLucid.Application.Agents.Evidence;

/// <summary>
///     Rejects blank and invisible-only curated-evidence strings (for example U+200B) that pass
///     <see cref="string.IsNullOrWhiteSpace(string?)" /> but are not usable operator-facing text.
/// </summary>
public static class ProposedEvidenceTextValidation
{
    public static bool HasSubstantiveText(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return false;

        string stripped = StripUnicodeFormatCharacters(value);

        if (stripped.Length == 0)
            return false;

        bool hasSubstantive = false;

        foreach (char character in stripped)
        {

            if (char.IsWhiteSpace(character))
                continue;

            UnicodeCategory category = char.GetUnicodeCategory(character);

            if (category is UnicodeCategory.Control)
                return false;

            hasSubstantive = true;
        }

        return hasSubstantive;
    }

    internal static string StripUnicodeFormatCharacters(string value)
    {
        if (value.Length == 0)
            return string.Empty;

        StringBuilder builder = new(value.Length);

        foreach (char character in value)
        {

            if (char.GetUnicodeCategory(character) is UnicodeCategory.Format)
                continue;

            builder.Append(character);
        }

        return builder.ToString();
    }
}

