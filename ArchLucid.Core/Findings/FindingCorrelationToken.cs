using System.Text;

namespace ArchLucid.Core.Findings;

/// <summary>ADR 0063 token rules shared by finding correlation key formats.</summary>
internal static class FindingCorrelationToken
{
    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        string trimmed = value.Trim().ToLowerInvariant();
        StringBuilder builder = new(trimmed.Length);
        bool previousWasSpace = false;

        foreach (char character in trimmed)
        {
            if (char.IsWhiteSpace(character))
            {
                if (!previousWasSpace)
                {
                    builder.Append(' ');
                    previousWasSpace = true;
                }

                continue;
            }

            builder.Append(character);
            previousWasSpace = false;
        }

        return builder.ToString();
    }
}
