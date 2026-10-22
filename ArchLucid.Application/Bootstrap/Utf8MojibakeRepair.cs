using System.Text;

namespace ArchLucid.Application.Bootstrap;

/// <summary>
///     Repairs UTF-8 punctuation that was persisted as Windows-1252 mojibake (for example em dash <c>—</c> stored as
///     <c>â€"</c>).
/// </summary>
internal static class Utf8MojibakeRepair
{
    internal static string? RepairOptional(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return value;

        if (value.IndexOf('â', StringComparison.Ordinal) < 0)
            return value;

        StringBuilder sb = new(value.Length);

        for (int i = 0; i < value.Length; i++)
        {
            if (TryConsumeMojibake(value, i, out string replacement, out int consumed))
            {
                sb.Append(replacement);
                i += consumed - 1;

                continue;
            }

            sb.Append(value[i]);
        }

        return sb.ToString();
    }

    private static bool TryConsumeMojibake(string value, int index, out string replacement, out int consumed)
    {
        replacement = string.Empty;
        consumed = 0;

        if (index + 2 >= value.Length || value[index] != 'â')
            return false;

        if (value[index + 1] == '€')
        {
            char third = value[index + 2];

            if (third is '\u201C' or '\u0093')
            {
                replacement = "–";
                consumed = 3;

                return true;
            }

            if (third is '\u201D' or '\u0094')
            {
                replacement = "—";
                consumed = 3;

                return true;
            }
        }

        if (value[index + 1] == '†' && index + 2 < value.Length)
        {
            char third = value[index + 2];

            if (third is '\'' or '\u2019')
            {
                replacement = "→";
                consumed = 3;

                return true;
            }
        }

        return false;
    }
}
