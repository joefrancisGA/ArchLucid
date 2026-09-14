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
            || HasCompactWeekSuffix(trimmed)
            || HasCompactWkSuffix(trimmed)
            || HasCompactWelSuffix(trimmed)
            || HasCompactWekSuffix(trimmed)
            || HasCompactWksSuffix(trimmed)
            || HasCompactWeksSuffix(trimmed)
            || HasCompactWeelSuffix(trimmed)
            || HasCompactWeelsSuffix(trimmed)
            || HasCompactWeekesSuffix(trimmed)
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
