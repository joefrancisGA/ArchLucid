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
               retailCollapsed.StartsWith(targetCollapsed, StringComparison.OrdinalIgnoreCase) ||
               targetCollapsed.StartsWith(retailCollapsed, StringComparison.OrdinalIgnoreCase) ||
               (targetCollapsed.Length > 4 && retailCollapsed.Contains(targetCollapsed,
                   StringComparison.OrdinalIgnoreCase));
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
        =>
            uom.Contains("Hour", StringComparison.OrdinalIgnoreCase)
            ||
            uom.Contains("hrs", StringComparison.OrdinalIgnoreCase);

    internal static bool IsMonthlyMeter(string uom)
        =>
            uom.Contains("Month",
                StringComparison.OrdinalIgnoreCase)
            ||
            uom.Contains("/Month", StringComparison.OrdinalIgnoreCase);

    internal static string OdataEscape(string literal)
        =>
            literal.Replace("'",
                "''",
                StringComparison.Ordinal);
}
