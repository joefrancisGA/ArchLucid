using System.Globalization;

namespace ArchLucid.Capabilities.Cost;

/// <summary>
///     Graph materializers persist cost properties with <see cref="CultureInfo.InvariantCulture" />.
/// </summary>
internal static class CostGraphDecimalParser
{
    private static readonly CultureInfo UsdDisplayCulture = CultureInfo.GetCultureInfo("en-US");

    public static string FormatUsdPerMonth(decimal amountUsd) =>
        $"{amountUsd.ToString("C0", UsdDisplayCulture)}/mo";

    public static bool TryParse(string? raw, out decimal value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = StripUtf8ByteOrderMark(raw.Trim());

        if (TryParseInvariantAmount(trimmed, out value))
        {
            return true;
        }

        int suffixSeparator = IndexOfSuffixSeparator(trimmed);

        if (suffixSeparator <= 0)
            return false;

        string numericPrefix = trimmed[..suffixSeparator].Trim();

        return TryParseInvariantAmount(numericPrefix, out value);
    }

    private static int IndexOfSuffixSeparator(string value)
    {
        for (int i = 0; i < value.Length; i++)
        {
            if (char.IsWhiteSpace(value[i]))
                return i;
        }

        return -1;
    }

    private static bool TryParseInvariantAmount(string token, out decimal value)
    {
        token = RemoveExportFormattingSpacesFromNumericToken(token);

        if (decimal.TryParse(
                token,
                NumberStyles.Number,
                CultureInfo.InvariantCulture,
                out value))
        {
            return true;
        }

        if (token.Length > 1 && token[0] == '$')
        {
            return decimal.TryParse(
                token[1..].Trim(),
                NumberStyles.Number,
                CultureInfo.InvariantCulture,
                out value);
        }

        if (token.Length >= 2 && token[0] == '(' && token[^1] == ')')
        {
            return TryParseInvariantAmount(token[1..^1].Trim(), out value);
        }

        return false;
    }

    private static string RemoveExportFormattingSpacesFromNumericToken(string token)
    {
        return token
            .Replace("\u00A0", string.Empty, StringComparison.Ordinal)
            .Replace("\u2009", string.Empty, StringComparison.Ordinal)
            .Replace("\u200A", string.Empty, StringComparison.Ordinal)
            .Replace("\u202F", string.Empty, StringComparison.Ordinal)
            .Replace("\u2007", string.Empty, StringComparison.Ordinal);
    }

    private static string StripUtf8ByteOrderMark(string value)
    {
        if (value.Length > 0 && value[0] == '\uFEFF')
            value = value[1..].TrimStart();

        if (value.Length > 0 && value[^1] == '\uFEFF')
            value = value[..^1].TrimEnd();

        return value;
    }
}
