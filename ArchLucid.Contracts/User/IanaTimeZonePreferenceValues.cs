namespace ArchLucid.Contracts.User;

/// <summary>Normalization and validation for personal IANA time zone preferences.</summary>
public static class IanaTimeZonePreferenceValues
{
    public const string Default = "UTC";

    /// <summary>Returns a normalized id or <see cref="Default" /> when <paramref name="value" /> is blank or invalid.</summary>
    public static string NormalizeOrDefault(string? value)
    {
        return NormalizeOrNull(value) ?? Default;
    }

    /// <summary>Returns a normalized id or null when <paramref name="value" /> is blank or not recognized on this host.</summary>
    public static string? NormalizeOrNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        if (IsUtcAlias(trimmed))
        {
            return Default;
        }

        try
        {
            TimeZoneInfo.FindSystemTimeZoneById(trimmed);

            return trimmed;
        }
        catch (TimeZoneNotFoundException)
        {
            return null;
        }
        catch (InvalidTimeZoneException)
        {
            return null;
        }
    }

    private static bool IsUtcAlias(string id)
    {
        return string.Equals(id, "UTC", StringComparison.OrdinalIgnoreCase)
            || string.Equals(id, "Etc/UTC", StringComparison.OrdinalIgnoreCase)
            || string.Equals(id, "Etc/GMT", StringComparison.OrdinalIgnoreCase)
            || string.Equals(id, "GMT", StringComparison.OrdinalIgnoreCase)
            || string.Equals(id, "Africa/Abidjan", StringComparison.OrdinalIgnoreCase);
    }
}
