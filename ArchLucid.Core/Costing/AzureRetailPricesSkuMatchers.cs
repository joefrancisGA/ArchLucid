namespace ArchLucid.Core.Costing;

public sealed partial class AzureRetailPricesCatalogClient
{
    internal static bool LooksLikeConsumptionUsd(RetailPriceDto row)
    {
        if (!string.Equals(row.CurrencyCode ?? string.Empty,
                "USD",
                StringComparison.OrdinalIgnoreCase))
            return false;

        string type = row.Type ?? string.Empty;

        if (!IsNonReservationRetailType(type)
            && type.Contains("Reservation", StringComparison.OrdinalIgnoreCase))
            return false;

        string meterTier = row.MeterTier ?? string.Empty;

        if (!IsNonGovernmentMeterTier(meterTier)
            && meterTier.Contains("Government", StringComparison.OrdinalIgnoreCase))
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

        return ContainsHourWordToken(trimmed)
            || ContainsBoundedToken(trimmed, " hrs")
            || ContainsBoundedToken(trimmed, " hr")
            || ContainsSlashHrToken(trimmed)
            || ContainsSlashHourToken(trimmed)
            || ContainsBoundedToken(trimmed, " h")
            || string.Equals(trimmed, "h", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hr", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hrs", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsHourWordToken(string trimmed)
    {
        return ContainsBoundedToken(trimmed, " hour")
            || ContainsBoundedToken(trimmed, " hours");
    }

    private static bool ContainsSlashHrToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/hr", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterHr = index + 3;

            if (afterHr >= trimmed.Length || !char.IsLetter(trimmed[afterHr]))
                return true;

            index = afterHr;
        }

        return false;
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

        return ContainsMonthWordToken(trimmed)
            || ContainsSlashMonthWordToken(trimmed)
            || ContainsSlashMonthToken(trimmed)
            || ContainsBoundedToken(trimmed, " mo")
            || string.Equals(trimmed, "mo", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsMonthWordToken(string trimmed)
    {
        return ContainsBoundedToken(trimmed, " month")
            || ContainsBoundedToken(trimmed, " months");
    }

    private static bool ContainsSlashMonthWordToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/month", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterMonth = index + 6;

            if (afterMonth >= trimmed.Length || !char.IsLetter(trimmed[afterMonth]))
                return true;

            index = afterMonth;
        }

        return false;
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

    private static bool IsNonReservationRetailType(string type)
    {
        if (type.Contains("non-reservation", StringComparison.OrdinalIgnoreCase))
            return true;

        if (type.Contains("nonreservation", StringComparison.OrdinalIgnoreCase))
            return true;

        if (type.Contains("non_reservation", StringComparison.OrdinalIgnoreCase))
            return true;

        if (type.Contains("non.reservation", StringComparison.OrdinalIgnoreCase))
            return true;

        if (type.Contains("non reservation", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    private static bool IsNonGovernmentMeterTier(string meterTier)
    {
        if (meterTier.Contains("non-government", StringComparison.OrdinalIgnoreCase))
            return true;

        if (meterTier.Contains("nongovernment", StringComparison.OrdinalIgnoreCase))
            return true;

        if (meterTier.Contains("non_government", StringComparison.OrdinalIgnoreCase))
            return true;

        if (meterTier.Contains("non.government", StringComparison.OrdinalIgnoreCase))
            return true;

        if (meterTier.Contains("non government", StringComparison.OrdinalIgnoreCase))
            return true;

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
}
