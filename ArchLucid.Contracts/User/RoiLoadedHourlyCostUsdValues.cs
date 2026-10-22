namespace ArchLucid.Contracts.User;

/// <summary>Stored values for personal ROI loaded hourly cost (USD).</summary>
public static class RoiLoadedHourlyCostUsdValues
{
    public const decimal Default = 150m;

    public const decimal Min = 1m;

    public const decimal Max = 10_000m;

    public static decimal ParseOrDefault(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return Default;
        }

        if (!decimal.TryParse(value.Trim(), out decimal parsed) || parsed < Min || parsed > Max)
        {
            return Default;
        }

        return parsed;
    }

    public static string Serialize(decimal value)
    {
        decimal normalized = value < Min ? Min : value > Max ? Max : decimal.Round(value, 2, MidpointRounding.AwayFromZero);

        return normalized.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture);
    }

    public static bool IsExplicitValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return decimal.TryParse(value.Trim(), out decimal parsed) && parsed >= Min && parsed <= Max;
    }
}
