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

        return AzureRetailPricesCatalogClient.IsMinuteMeter(meter) ||
               AzureRetailPricesCatalogClient.IsHourMeter(meter) ||
               AzureRetailPricesCatalogClient.IsDayMeter(meter) ||
               AzureRetailPricesCatalogClient.IsWeekMeter(meter) ||
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

        if (IsMinuteMeter(raw))
        {
            decimal perResource = decimal.Multiply(unit,
                (decimal)MinutesPerMonthAssumption);

            monthly = decimal.Multiply(perResource, quantity);

            return true;
        }

        if (IsHourMeter(raw))
        {
            decimal perResource = decimal.Multiply(unit,
                (decimal)HoursPerMonthAssumption);

            monthly = decimal.Multiply(perResource, quantity);

            return true;
        }

        if (IsDayMeter(raw))
        {
            decimal perResource = decimal.Multiply(unit,
                (decimal)DaysPerMonthAssumption);

            monthly = decimal.Multiply(perResource, quantity);

            return true;
        }

        if (IsWeekMeter(raw))
        {
            decimal perResource = decimal.Multiply(unit,
                (decimal)WeeksPerMonthAssumption);

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

    internal static bool IsMinuteMeter(string uom)
    {
        if (string.IsNullOrWhiteSpace(uom))
            return false;

        string trimmed = uom.Trim();

        return ContainsMinuteWordToken(trimmed)
            || ContainsBoundedToken(trimmed, " mi")
            || ContainsBoundedToken(trimmed, " mis")
            || ContainsSlashMiToken(trimmed)
            || ContainsSlashMinToken(trimmed)
            || ContainsSlashMinsToken(trimmed)
            || ContainsSlashMisToken(trimmed)
            || ContainsSlashMinuteWordToken(trimmed)
            || ContainsSlashMinutesToken(trimmed)
            || HasCompactMinuteSuffix(trimmed)
            || HasCompactMinsSuffix(trimmed)
            || HasCompactMisSuffix(trimmed)
            || HasCompactMiSuffix(trimmed)
            || HasCompactMinuteWordSuffix(trimmed)
            || HasCompactMinutesWordSuffix(trimmed)
            || string.Equals(trimmed, "min", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "mins", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "mi", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "mis", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "minute", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "minutes", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsMinuteWordToken(string trimmed)
    {
        return ContainsBoundedToken(trimmed, " min")
            || ContainsBoundedToken(trimmed, " mins")
            || ContainsBoundedToken(trimmed, " minute")
            || ContainsBoundedToken(trimmed, " minutes");
    }


    private static bool ContainsSlashMiToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/mi", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterMi = index + 3;

            if (afterMi >= trimmed.Length || !char.IsLetter(trimmed[afterMi]))
                return true;

            index = afterMi;
        }

        return false;
    }

    private static bool ContainsSlashMinToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/min", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterMin = index + 4;

            if (afterMin >= trimmed.Length || !char.IsLetter(trimmed[afterMin]))
                return true;

            index = afterMin;
        }

        return false;
    }


    private static bool ContainsSlashMisToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/mis", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterMis = index + 4;

            if (afterMis >= trimmed.Length || !char.IsLetter(trimmed[afterMis]))
                return true;

            index = afterMis;
        }

        return false;
    }

    private static bool ContainsSlashMinsToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/mins", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterMins = index + 5;

            if (afterMins >= trimmed.Length || !char.IsLetter(trimmed[afterMins]))
                return true;

            index = afterMins;
        }

        return false;
    }

    private static bool ContainsSlashMinuteWordToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/minute", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterMinute = index + 7;

            if (afterMinute >= trimmed.Length || !char.IsLetter(trimmed[afterMinute]))
                return true;

            index = afterMinute;
        }

        return false;
    }

    private static bool ContainsSlashMinutesToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/minutes", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterMinutes = index + 8;

            if (afterMinutes >= trimmed.Length || !char.IsLetter(trimmed[afterMinutes]))
                return true;

            index = afterMinutes;
        }

        return false;
    }

    internal static bool IsHourMeter(string uom)
    {
        if (string.IsNullOrWhiteSpace(uom))
            return false;

        string trimmed = uom.Trim();

        return ContainsHourWordToken(trimmed)
            || ContainsBoundedToken(trimmed, " hrs")
            || ContainsBoundedToken(trimmed, " hr")
            || ContainsSlashHrToken(trimmed)
            || ContainsSlashHrsToken(trimmed)
            || ContainsSlashHourWordToken(trimmed)
            || ContainsSlashHoursToken(trimmed)
            || ContainsSlashHourToken(trimmed)
            || ContainsBoundedToken(trimmed, " h")
            || HasCompactHourSuffix(trimmed)
            || HasCompactHrSuffix(trimmed)
            || HasCompactHrsSuffix(trimmed)
            || HasCompactHourWordSuffix(trimmed)
            || HasCompactHoursWordSuffix(trimmed)
            || string.Equals(trimmed, "h", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hr", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hrs", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hour", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hours", StringComparison.OrdinalIgnoreCase);
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

    private static bool ContainsSlashHrsToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/hrs", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterHrs = index + 4;

            if (afterHrs >= trimmed.Length || !char.IsLetter(trimmed[afterHrs]))
                return true;

            index = afterHrs;
        }

        return false;
    }

    private static bool ContainsSlashHourWordToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/hour", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterHour = index + 5;

            if (afterHour >= trimmed.Length || !char.IsLetter(trimmed[afterHour]))
                return true;

            index = afterHour;
        }

        return false;
    }

    private static bool ContainsSlashHoursToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/hours", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterHours = index + 6;

            if (afterHours >= trimmed.Length || !char.IsLetter(trimmed[afterHours]))
                return true;

            index = afterHours;
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

    internal static bool IsDayMeter(string uom)
    {
        if (string.IsNullOrWhiteSpace(uom))
            return false;

        string trimmed = uom.Trim();

        return ContainsDayWordToken(trimmed)
            || ContainsSlashDayToken(trimmed)
            || ContainsSlashDaysToken(trimmed)
            || ContainsSlashDyToken(trimmed)
            || ContainsSlashDToken(trimmed)
            || ContainsBoundedToken(trimmed, " dy")
            || ContainsBoundedToken(trimmed, " d")
            || HasCompactDaySuffix(trimmed)
            || HasCompactDySuffix(trimmed)
            || HasCompactDayWordSuffix(trimmed)
            || HasCompactDaysWordSuffix(trimmed)
            || string.Equals(trimmed, "day", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "days", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "d", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "dy", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsDayWordToken(string trimmed)
    {
        return ContainsBoundedToken(trimmed, " day")
            || ContainsBoundedToken(trimmed, " days");
    }

    private static bool ContainsSlashDayToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/day", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterDay = index + 4;

            if (afterDay >= trimmed.Length || !char.IsLetter(trimmed[afterDay]))
                return true;

            index = afterDay;
        }

        return false;
    }

    private static bool ContainsSlashDaysToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/days", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterDays = index + 5;

            if (afterDays >= trimmed.Length || !char.IsLetter(trimmed[afterDays]))
                return true;

            index = afterDays;
        }

        return false;
    }

    private static bool ContainsSlashDyToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/dy", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterDy = index + 3;

            if (afterDy >= trimmed.Length || !char.IsLetter(trimmed[afterDy]))
                return true;

            index = afterDy;
        }

        return false;
    }

    private static bool ContainsSlashDToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/d", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterD = index + 2;

            if (afterD >= trimmed.Length || !char.IsLetter(trimmed[afterD]))
                return true;

            index = afterD;
        }

        return false;
    }

    internal static bool IsWeekMeter(string uom)
    {
        if (string.IsNullOrWhiteSpace(uom))
            return false;

        string trimmed = uom.Trim();

        return ContainsWeekWordToken(trimmed)
            || ContainsSlashWeekToken(trimmed)
            || ContainsSlashWeeksToken(trimmed)
            || ContainsSlashWksToken(trimmed)
            || ContainsSlashWkToken(trimmed)
            || ContainsSpacedSlashWToken(trimmed)
            || ContainsSpacedSlashWelToken(trimmed)
            || ContainsSpacedSlashWekToken(trimmed)
            || ContainsSpacedSlashWeksToken(trimmed)
            || ContainsSpacedSlashWeeeksToken(trimmed)
            || ContainsSpacedSlashWeekkToken(trimmed)
            || ContainsSpacedSlashWeeeeekToken(trimmed)
            || ContainsSpacedSlashWeekkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkkToken(trimmed)
            || ContainsSpacedSlashWeekkkkkkkkkToken(trimmed)
            || ContainsSlashWToken(trimmed)
            || ContainsBoundedToken(trimmed, " w")
            || ContainsBoundedToken(trimmed, " wk")
            || ContainsBoundedToken(trimmed, " wks")
            || ContainsBoundedToken(trimmed, " wel")
            || ContainsBoundedToken(trimmed, " wek")
            || ContainsBoundedToken(trimmed, " weks")
            || ContainsBoundedToken(trimmed, " weel")
            || ContainsBoundedToken(trimmed, " weels")
            || ContainsBoundedToken(trimmed, " wels")
            || ContainsBoundedToken(trimmed, " weekes")
            || HasCompactWeekSuffix(trimmed)
            || HasCompactWkSuffix(trimmed)
            || HasCompactWelSuffix(trimmed)
            || HasCompactWekSuffix(trimmed)
            || HasCompactWksSuffix(trimmed)
            || HasCompactWeksSuffix(trimmed)
            || HasCompactWekksSuffix(trimmed)
            || HasCompactWeekkSuffix(trimmed)
            || HasCompactWeekkkSuffix(trimmed)
            || HasCompactWeekkkkSuffix(trimmed)
            || HasCompactWeekkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkkkkkkSuffix(trimmed)
            || HasCompactWeekkkkkSuffix(trimmed)
            || HasCompactWeelSuffix(trimmed)
            || HasCompactWeelsSuffix(trimmed)
            || HasCompactWeekesSuffix(trimmed)
            || HasCompactWeeeksSuffix(trimmed)
            || HasCompactWeeeekSuffix(trimmed)
            || HasCompactWeeeeekSuffix(trimmed)
            || HasCompactWelsSuffix(trimmed)
            || HasCompactWeekWordSuffix(trimmed)
            || HasCompactWeeksWordSuffix(trimmed)
            || string.Equals(trimmed, "week", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "weeks", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "w", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "wk", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "wks", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsWeekWordToken(string trimmed)
    {
        return ContainsBoundedToken(trimmed, " week")
            || ContainsBoundedToken(trimmed, " weeks");
    }

    private static bool ContainsSlashWeekToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/week", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterWeek = index + 5;

            if (afterWeek >= trimmed.Length || !char.IsLetter(trimmed[afterWeek]))
                return true;

            index = afterWeek;
        }

        return false;
    }

    private static bool ContainsSlashWeeksToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/weeks", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterWeeks = index + 6;

            if (afterWeeks >= trimmed.Length || !char.IsLetter(trimmed[afterWeeks]))
                return true;

            index = afterWeeks;
        }

        return false;
    }

    private static bool ContainsSlashWksToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/wks", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterWks = index + 4;

            if (afterWks >= trimmed.Length || !char.IsLetter(trimmed[afterWks]))
                return true;

            index = afterWks;
        }

        return false;
    }

    private static bool ContainsSlashWkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/wk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterWk = index + 3;

            if (afterWk >= trimmed.Length || !char.IsLetter(trimmed[afterWk]))
                return true;

            index = afterWk;
        }

        return false;
    }


    private static bool ContainsSpacedSlashWeekkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 8;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

                private static bool ContainsSpacedSlashWeekkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 15;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 16;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 17;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 18;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 19;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 20;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 21;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 22;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 23;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

            private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 25;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 26;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 27;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 28;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

            private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 30;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 31;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 32;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 33;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

            private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0)
                return false;
            int afterToken = index + 35;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0)
                return false;
            int afterToken = index + 36;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0)
                return false;
            int afterToken = index + 37;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0)
                return false;
            int afterToken = index + 38;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;
            index = afterToken;
        }
        return false;
    }

            private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 40;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 41;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 42;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 43;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

            private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 45;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 46;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 47;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 48;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

            private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 50;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 51;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 52;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 53;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

            private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 55;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 56;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

        private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 57;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

    private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 54;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

    private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 49;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

    private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + 44;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }
        return false;
    }

    private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;
        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0)
                return false;
            int afterToken = index + 39;
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;
            index = afterToken;
        }
        return false;
    }

    private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 34;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

    private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 29;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

    private static bool ContainsSpacedSlashWeekkkkkkkkkkkkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkkkkkkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 24;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

    private static bool ContainsSpacedSlashWeekkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 11;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

    private static bool ContainsSpacedSlashWeekkkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 14;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

    private static bool ContainsSpacedSlashWeekkkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 13;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

    private static bool ContainsSpacedSlashWeekkkkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 12;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

    private static bool ContainsSpacedSlashWeekkkkToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weekkkk", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 10;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

    private static bool ContainsSpacedSlashWeeeeekToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weeeeek", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 10;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

    private static bool ContainsSpacedSlashWeeeksToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weeeks", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 9;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

    private static bool ContainsSpacedSlashWToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / w", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 4;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }

    private static bool ContainsSpacedSlashWelToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / wel", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterWel = index + 6;

            if (afterWel >= trimmed.Length || !char.IsLetter(trimmed[afterWel]))
                return true;

            index = afterWel;
        }

        return false;
    }

    private static bool ContainsSpacedSlashWekToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / wek", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterWek = index + 6;

            if (afterWek >= trimmed.Length || !char.IsLetter(trimmed[afterWek]))
                return true;

            index = afterWek;
        }

        return false;
    }

    private static bool ContainsSpacedSlashWeksToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / weks", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterWeks = index + 7;

            if (afterWeks >= trimmed.Length || !char.IsLetter(trimmed[afterWeks]))
                return true;

            index = afterWeks;
        }

        return false;
    }

    private static bool ContainsSlashWToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/w", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterW = index + 2;

            if (afterW >= trimmed.Length || !char.IsLetter(trimmed[afterW]))
                return true;

            index = afterW;
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
            || ContainsSlashMonthsToken(trimmed)
            || ContainsSlashMosToken(trimmed)
            || ContainsSlashMonToken(trimmed)
            || ContainsSlashMnToken(trimmed)
            || ContainsSlashMonthToken(trimmed)
            || ContainsSlashMToken(trimmed)
            || ContainsBoundedToken(trimmed, " m")
            || ContainsBoundedToken(trimmed, " mo")
            || ContainsBoundedToken(trimmed, " mon")
            || ContainsBoundedToken(trimmed, " mn")
            || ContainsBoundedToken(trimmed, " mos")
            || HasCompactMonthSuffix(trimmed)
            || HasCompactMonSuffix(trimmed)
            || HasCompactMnSuffix(trimmed)
            || HasCompactMSuffix(trimmed)
            || HasCompactMosSuffix(trimmed)
            || HasCompactMonthWordSuffix(trimmed)
            || HasCompactMonthsWordSuffix(trimmed)
            || string.Equals(trimmed, "m", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "mo", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "month", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "months", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "mon", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "mn", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "mos", StringComparison.OrdinalIgnoreCase);
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

    private static bool ContainsSlashMonthsToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/months", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterMonths = index + 7;

            if (afterMonths >= trimmed.Length || !char.IsLetter(trimmed[afterMonths]))
                return true;

            index = afterMonths;
        }

        return false;
    }

    private static bool ContainsSlashMonToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/mon", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterMon = index + 4;

            if (afterMon >= trimmed.Length || !char.IsLetter(trimmed[afterMon]))
                return true;

            index = afterMon;
        }

        return false;
    }

    private static bool ContainsSlashMosToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/mos", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterMos = index + 4;

            if (afterMos >= trimmed.Length || !char.IsLetter(trimmed[afterMos]))
                return true;

            index = afterMos;
        }

        return false;
    }

    private static bool ContainsSlashMnToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/mn", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterMn = index + 3;

            if (afterMn >= trimmed.Length || !char.IsLetter(trimmed[afterMn]))
                return true;

            index = afterMn;
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

    private static bool ContainsSlashMToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("/m", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterM = index + 2;

            if (afterM >= trimmed.Length || !char.IsLetter(trimmed[afterM]))
                return true;

            index = afterM;
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

        if (type.Contains("non.reservation", StringComparison.OrdinalIgnoreCase))
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

        if (meterTier.Contains("non.government", StringComparison.OrdinalIgnoreCase))
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



    private static bool HasCompactHoursWordSuffix(string trimmed)
    {
        if (trimmed.Length < 6)
            return false;

        return trimmed.EndsWith("hours", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^6]);
    }

    private static bool HasCompactHourWordSuffix(string trimmed)
    {
        if (trimmed.Length < 5)
            return false;

        return trimmed.EndsWith("hour", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^5]);
    }



    private static bool HasCompactMonthsWordSuffix(string trimmed)
    {
        if (trimmed.Length < 7)
            return false;

        return trimmed.EndsWith("months", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^7]);
    }

    private static bool HasCompactMonthWordSuffix(string trimmed)
    {
        if (trimmed.Length < 6)
            return false;

        return trimmed.EndsWith("month", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^6]);
    }

    private static bool HasCompactDaySuffix(string trimmed)
    {
        if (trimmed.Length < 2)
            return false;

        char suffix = trimmed[^1];

        if (suffix is not 'd' and not 'D')
            return false;

        return char.IsDigit(trimmed[^2]);
    }

    private static bool HasCompactDySuffix(string trimmed)
    {
        if (trimmed.Length < 3)
            return false;

        return trimmed.EndsWith("dy", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^3]);
    }




    private static bool HasCompactWeeksWordSuffix(string trimmed)
    {
        if (trimmed.Length < 6)
            return false;

        return trimmed.EndsWith("weeks", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^6]);
    }

    private static bool HasCompactWeeeekSuffix(string trimmed)
    {
        if (trimmed.Length < 8)
            return false;

        return trimmed.EndsWith("weeeek", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^7]);
    }

    private static bool HasCompactWeeeeekSuffix(string trimmed)
    {
        if (trimmed.Length < 9)
            return false;

        return trimmed.EndsWith("weeeeek", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^8]);
    }

    private static bool HasCompactWeeeksSuffix(string trimmed)
    {
        if (trimmed.Length < 8)
            return false;

        return trimmed.EndsWith("weeeks", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^7]);
    }

    private static bool HasCompactWeekWordSuffix(string trimmed)
    {
        if (trimmed.Length < 5)
            return false;

        return trimmed.EndsWith("week", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^5]);
    }

    private static bool HasCompactDayWordSuffix(string trimmed)
    {
        if (trimmed.Length < 4)
            return false;

        return trimmed.EndsWith("day", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^4]);
    }

    private static bool HasCompactDaysWordSuffix(string trimmed)
    {
        if (trimmed.Length < 5)
            return false;

        return trimmed.EndsWith("days", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^5]);
    }

    private static bool HasCompactWeekSuffix(string trimmed)
    {
        if (trimmed.Length < 2)
            return false;

        char suffix = trimmed[^1];

        if (suffix is not 'w' and not 'W')
            return false;

        return char.IsDigit(trimmed[^2]);
    }


    private static bool HasCompactWkSuffix(string trimmed)
    {
        if (trimmed.Length < 4)
            return false;

        return trimmed.EndsWith("wk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^4]);
    }



    private static bool HasCompactWelSuffix(string trimmed)
    {
        if (trimmed.Length < 5)
            return false;

        return trimmed.EndsWith("wel", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^4]);
    }

    private static bool HasCompactWekSuffix(string trimmed)
    {
        if (trimmed.Length < 5)
            return false;

        return trimmed.EndsWith("wek", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^4]);
    }

    private static bool HasCompactWksSuffix(string trimmed)
    {
        if (trimmed.Length < 5)
            return false;

        return trimmed.EndsWith("wks", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^4]);
    }


    private static bool HasCompactWeekkSuffix(string trimmed)
    {
        if (trimmed.Length < 7)
            return false;

        return trimmed.EndsWith("weekk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^6]);
    }

    private static bool HasCompactWeekkkSuffix(string trimmed)
    {
        if (trimmed.Length < 8)
            return false;

        return trimmed.EndsWith("weekkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^7]);
    }

    private static bool HasCompactWeekkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 10)
            return false;

        return trimmed.EndsWith("weekkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^9]);
    }

    private static bool HasCompactWeekkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 15)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^14]);
    }

        private static bool HasCompactWeekkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 16)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^15]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 17)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^16]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 18)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^17]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 19)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^18]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 20)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^19]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 21)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^20]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 22)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^21]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 23)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^22]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 24)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^23]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 25)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^24]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 26)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^25]);
    }

            private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 28)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^27]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 29)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^28]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 30)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^29]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 31)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^30]);
    }

            private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 33)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^32]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 34)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^33]);
    }

            private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 38)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^37]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 39)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^38]);
    }

            private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 41)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^40]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 42)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^41]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 43)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^42]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 44)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^43]);
    }

            private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 46)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^45]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 47)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^46]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 48)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^47]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 49)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^48]);
    }

            private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 51)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^50]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 52)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^51]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 53)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^52]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 54)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^53]);
    }

            private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 56)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^55]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 57)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^56]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 58)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^57]);
    }

    private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 55)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^54]);
    }

    private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 50)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^49]);
    }

    private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 45)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^44]);
    }

    private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 40)
            return false;
        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^39]);
    }

    private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 35)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^34]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 36)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^35]);
    }

        private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 37)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^36]);
    }

    private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 32)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^31]);
    }

    private static bool HasCompactWeekkkkkkkkkkkkkkkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 27)
            return false;

        return trimmed.EndsWith("weekkkkkkkkkkkkkkkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^26]);
    }

    private static bool HasCompactWeekkkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 14)
            return false;

        return trimmed.EndsWith("weekkkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^13]);
    }

    private static bool HasCompactWeekkkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 13)
            return false;

        return trimmed.EndsWith("weekkkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^12]);
    }

    private static bool HasCompactWeekkkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 12)
            return false;

        return trimmed.EndsWith("weekkkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^11]);
    }

    private static bool HasCompactWeekkkkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 11)
            return false;

        return trimmed.EndsWith("weekkkkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^10]);
    }

    private static bool HasCompactWeekkkkSuffix(string trimmed)
    {
        if (trimmed.Length < 9)
            return false;

        return trimmed.EndsWith("weekkkk", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^8]);
    }

    private static bool HasCompactWekksSuffix(string trimmed)
    {
        if (trimmed.Length < 7)
            return false;

        return trimmed.EndsWith("wekks", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^6]);
    }

    private static bool HasCompactWeksSuffix(string trimmed)
    {
        if (trimmed.Length < 6)
            return false;

        return trimmed.EndsWith("weks", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^5]);
    }

    private static bool HasCompactWeelSuffix(string trimmed)
    {
        if (trimmed.Length < 6)
            return false;

        return trimmed.EndsWith("weel", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^5]);
    }

    private static bool HasCompactWelsSuffix(string trimmed)
    {
        if (trimmed.Length < 6)
            return false;

        return trimmed.EndsWith("wels", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^5]);
    }

    private static bool HasCompactWeelsSuffix(string trimmed)
    {
        if (trimmed.Length < 7)
            return false;

        return trimmed.EndsWith("weels", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^6]);
    }

    private static bool HasCompactWeekesSuffix(string trimmed)
    {
        if (trimmed.Length < 8)
            return false;

        return trimmed.EndsWith("weekes", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^7]);
    }

    private static bool HasCompactMonthSuffix(string trimmed)
    {
        if (trimmed.Length < 3)
            return false;

        return trimmed.EndsWith("mo", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^3]);
    }

    private static bool HasCompactMonSuffix(string trimmed)
    {
        if (trimmed.Length < 4)
            return false;

        return trimmed.EndsWith("mon", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^4]);
    }

    private static bool HasCompactMnSuffix(string trimmed)
    {
        if (trimmed.Length < 3)
            return false;

        return trimmed.EndsWith("mn", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^3]);
    }

    private static bool HasCompactHourSuffix(string trimmed)
    {
        if (trimmed.Length < 2)
            return false;

        char suffix = trimmed[^1];

        if (suffix is not 'h' and not 'H')
            return false;

        return char.IsDigit(trimmed[^2]);
    }

    private static bool HasCompactHrSuffix(string trimmed)
    {
        if (trimmed.Length < 3)
            return false;

        return trimmed.EndsWith("hr", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^3]);
    }

    private static bool HasCompactHrsSuffix(string trimmed)
    {
        if (trimmed.Length < 4)
            return false;

        return trimmed.EndsWith("hrs", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^4]);
    }

    private static bool HasCompactMinuteSuffix(string trimmed)
    {
        if (trimmed.Length < 4)
            return false;

        return trimmed.EndsWith("min", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^4]);
    }


    private static bool HasCompactMinsSuffix(string trimmed)
    {
        if (trimmed.Length < 5)
            return false;

        return trimmed.EndsWith("mins", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^5]);
    }

    private static bool HasCompactMiSuffix(string trimmed)
    {
        if (trimmed.Length < 3)
            return false;

        return trimmed.EndsWith("mi", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^3]);
    }

    private static bool HasCompactMisSuffix(string trimmed)
    {
        if (trimmed.Length < 4)
            return false;

        return trimmed.EndsWith("mis", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^4]);
    }

    private static bool HasCompactMinuteWordSuffix(string trimmed)
    {
        if (trimmed.Length < 7)
            return false;

        return trimmed.EndsWith("minute", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^7]);
    }

    private static bool HasCompactMinutesWordSuffix(string trimmed)
    {
        if (trimmed.Length < 8)
            return false;

        return trimmed.EndsWith("minutes", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^8]);
    }


    private static bool HasCompactMSuffix(string trimmed)
    {
        if (trimmed.Length < 3)
            return false;

        char suffix = trimmed[^1];

        if (suffix is not 'm' and not 'M')
            return false;

        return char.IsDigit(trimmed[^2]);
    }

    private static bool HasCompactMosSuffix(string trimmed)
    {
        if (trimmed.Length < 4)
            return false;

        return trimmed.EndsWith("mos", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^4]);
    }
}
