using System.Globalization;

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

        bool hasSubstantive = false;

        foreach (char character in value)
        {

            if (char.IsWhiteSpace(character))
                continue;

            UnicodeCategory category = char.GetUnicodeCategory(character);

            if (category is UnicodeCategory.Format or UnicodeCategory.Control)
                return false;

            hasSubstantive = true;
        }

        return hasSubstantive;
    }
}

