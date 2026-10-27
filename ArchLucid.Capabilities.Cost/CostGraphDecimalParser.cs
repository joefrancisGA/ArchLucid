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

        string trimmed = raw.Trim();

        return decimal.TryParse(
            trimmed,
            NumberStyles.Number,
            CultureInfo.InvariantCulture,
            out value);
    }
}
