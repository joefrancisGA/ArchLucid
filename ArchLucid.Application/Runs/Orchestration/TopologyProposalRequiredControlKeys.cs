using System.Globalization;
using System.Text;

namespace ArchLucid.Application.Runs.Orchestration;

internal static class TopologyProposalRequiredControlKeys
{
    internal static string NormalizeManifestEndpointIdentity(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        return StripUnicodeFormatCharacters(value.Trim());
    }

    internal static string NormalizeKey(string control)
    {
        if (string.IsNullOrWhiteSpace(control))
            return string.Empty;

        string withoutFormatCharacters = StripUnicodeFormatCharacters(control.Trim());

        if (withoutFormatCharacters.Length == 0)
            return string.Empty;

        string[] segments = withoutFormatCharacters.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);

        return segments.Length == 0 ? string.Empty : string.Join(' ', segments);
    }

    private static string StripUnicodeFormatCharacters(string value)
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
