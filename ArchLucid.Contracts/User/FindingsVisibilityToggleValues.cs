namespace ArchLucid.Contracts.User;

/// <summary>Stored values for personal findings visibility toggles (hide-generic, show-low, show-advisory).</summary>
public static class FindingsVisibilityToggleValues
{
    public const string True = "true";

    public const string False = "false";

    public const string Default = False;

    public static bool ParseOrDefault(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string trimmed = value.Trim();

        if (string.Equals(trimmed, True, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "1", StringComparison.Ordinal))
        {
            return true;
        }

        if (string.Equals(trimmed, False, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "0", StringComparison.Ordinal))
        {
            return false;
        }

        return false;
    }

    public static string Serialize(bool enabled)
    {
        return enabled ? True : False;
    }

    public static bool IsExplicitValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string trimmed = value.Trim();

        return string.Equals(trimmed, True, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, False, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "1", StringComparison.Ordinal)
            || string.Equals(trimmed, "0", StringComparison.Ordinal);
    }
}
