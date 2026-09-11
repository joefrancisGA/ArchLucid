namespace ArchLucid.Application.Agents.Evidence;

/// <summary>
/// Rejects catalog text that passes <see cref="string.IsNullOrWhiteSpace(string?)" /> but has no visible content.
/// </summary>
internal static class ProposedEvidenceTextValidation
{
    internal static bool HasSubstantiveText(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return false;

        bool hasSubstantive = false;

        foreach (char character in value)
        {

            if (char.IsWhiteSpace(character))
                continue;

            if (char.GetUnicodeCategory(character) is System.Globalization.UnicodeCategory.Format
                or System.Globalization.UnicodeCategory.Control)
                return false;

            hasSubstantive = true;
        }

        return hasSubstantive;
    }
}
