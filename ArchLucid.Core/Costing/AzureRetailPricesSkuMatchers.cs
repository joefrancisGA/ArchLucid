using System.Text.RegularExpressions;

namespace ArchLucid.Core.Costing;

public sealed partial class AzureRetailPricesCatalogClient
{
    internal static Uri ComposeRetailRelativeUri(string filterClause)
        =>
            new(
                $"{RetailPriceQueries.RetailPricesRelativePath}?{RetailPriceQueries.FilterParameter}={Uri.EscapeDataString(filterClause)}",
                UriKind.Relative);

    internal static bool RowMatchesSku(string armSkuHint, string? retailSkuPricing) =>
        RowMatchesCollapsed(CollapseComparableSku(armSkuHint), CollapseComparableSku(retailSkuPricing));

    internal static bool RowMatchesCollapsed(string targetCollapsed, string retailCollapsed)
    {
        if (targetCollapsed.Length == 0 || retailCollapsed.Length == 0)
            return false;

        return string.Equals(retailCollapsed,
                targetCollapsed,
                StringComparison.OrdinalIgnoreCase)
               ||
               HasCollapsedSkuPrefix(retailCollapsed, targetCollapsed) ||
               HasCollapsedSkuPrefix(targetCollapsed, retailCollapsed) ||
               (targetCollapsed.Length > 4 && CollapsedSkuContains(retailCollapsed, targetCollapsed));
    }

    private static bool CollapsedSkuContains(string haystack, string needle)
    {
        if (needle.Length == 0 || haystack.Length < needle.Length)
            return false;

        int index = 0;

        while (index <= haystack.Length - needle.Length)
        {
            index = haystack.IndexOf(needle, index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            if (HasCollapsedSkuBoundary(haystack, index, needle.Length))
                return true;

            index++;
        }

        return false;
    }

    private static bool HasCollapsedSkuPrefix(string haystack, string needle)
        =>
            HasCollapsedSkuBoundary(haystack, 0, needle.Length)
            && haystack.StartsWith(needle, StringComparison.OrdinalIgnoreCase);

    private static bool HasCollapsedSkuBoundary(string haystack, int index, int needleLength)
    {
        int endIndex = index + needleLength;

        if (endIndex < haystack.Length)
        {
            char next = haystack[endIndex];

            if (next is >= '0' and <= '9' or '-')
                return false;

            // Reject letter-variant suffixes such as Standard_D4 matching Standard_D4s_v5.
            if (endIndex > 0
                && haystack[endIndex - 1] is >= '0' and <= '9'
                && char.IsLetter(next))
                return false;
        }

        if (index > 0)
        {
            char previous = haystack[index - 1];

            if (previous is >= '0' and <= '9')
                return false;

            // Reject letter-variant prefixes such as Standard_VE2s_v5 matching E2s_v5.
            if (char.IsUpper(previous))
                return false;
        }

        return true;
    }

    internal static string CollapseComparableSku(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        return Regex.Replace(value.Trim(),
            @"[\s_]+",
            string.Empty,
            RegexOptions.None,
            TimeSpan.FromSeconds(1));
    }

    internal static bool LooksLikeConsumptionUsd(RetailPriceDto row)
    {
        if (!string.Equals(row.CurrencyCode ?? string.Empty,
                "USD",
                StringComparison.OrdinalIgnoreCase))
            return false;

        if ((row.Type ?? string.Empty)
                .
                Contains("Reservation",
                    StringComparison.OrdinalIgnoreCase))
            return false;

        if ((row.MeterTier ?? string.Empty).Contains("Government",
                StringComparison.OrdinalIgnoreCase))
            return false;

        string meterName = row.MeterName ?? string.Empty;

        if (meterName.Contains("Rsv", StringComparison.OrdinalIgnoreCase))
            return false;

        string meter = row.UnitOfMeasure ?? string.Empty;

        return AzureRetailPricesCatalogClient.IsHourMeter(meter) ||
               AzureRetailPricesCatalogClient.IsMonthlyMeter(meter);
    }

    internal static bool TryMonthlyUsdFromRow(RetailPriceDto dto, int quantity, out decimal monthly)
    {
        decimal unit =
            PreferUnit(dto);

        monthly = 0;

        if (unit <= 0m)
            return false;

        string raw = dto.UnitOfMeasure ?? string.Empty;

        if (IsHourMeter(raw))
        {
            decimal perResource = decimal.Multiply(unit,
                (decimal)HoursPerMonthAssumption);

            monthly = decimal.Multiply(perResource, quantity);

            return true;
        }

        if (!IsMonthlyMeter(raw))
            return false;

        monthly = decimal.Multiply(unit, quantity);

        return true;
    }

    internal static decimal PreferUnit(RetailPriceDto dto)
        =>
            dto.UnitPrice is { } up and > 0 ?
                up
                :
                dto.RetailPrice ?? 0m;

    internal static bool IsHourMeter(string uom)
    {
        if (string.IsNullOrWhiteSpace(uom))
            return false;

        string trimmed = uom.Trim();

        return trimmed.Contains("Hour", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("hrs", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains(" hr", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("/hr", StringComparison.OrdinalIgnoreCase)
            || ContainsSlashHourToken(trimmed)
            || ContainsBoundedToken(trimmed, " h")
            || string.Equals(trimmed, "h", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hr", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsSlashHourToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/h", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterH = index + 2;

            if (afterH >= trimmed.Length || !char.IsLetter(trimmed[afterH]))
                return true;

            index = afterH;
        }

        return false;
    }

    internal static bool IsMonthlyMeter(string uom)
    {
        if (string.IsNullOrWhiteSpace(uom))
            return false;

        string trimmed = uom.Trim();

        return trimmed.Contains("Month", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("/Month", StringComparison.OrdinalIgnoreCase)
            || ContainsSlashMonthToken(trimmed)
            || ContainsBoundedToken(trimmed, " mo")
            || string.Equals(trimmed, "mo", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsSlashMonthToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/mo", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterMo = index + 3;

            if (afterMo >= trimmed.Length || !char.IsLetter(trimmed[afterMo]))
                return true;

            index = afterMo;
        }

        return false;
    }

    private static bool ContainsBoundedToken(string trimmed, string token)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(token, index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + token.Length;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

    internal static string OdataEscape(string literal)
        =>
            literal.Replace("'",
                "''",
                StringComparison.Ordinal);
}
