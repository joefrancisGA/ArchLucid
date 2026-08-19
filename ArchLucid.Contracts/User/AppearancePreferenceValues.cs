namespace ArchLucid.Contracts.User;

/// <summary>Allowed values for user appearance / color-mode preference.</summary>
public static class AppearancePreferenceValues
{
    public const string System = "system";

    public const string Light = "light";

    public const string Dark = "dark";

    public const string Default = System;

    /// <summary>Returns a normalized preference or null when <paramref name="value" /> is not allowed.</summary>
    public static string? NormalizeOrNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        if (string.Equals(trimmed, System, StringComparison.OrdinalIgnoreCase))
        {
            return System;
        }

        if (string.Equals(trimmed, Light, StringComparison.OrdinalIgnoreCase))
        {
            return Light;
        }

        if (string.Equals(trimmed, Dark, StringComparison.OrdinalIgnoreCase))
        {
            return Dark;
        }

        return null;
    }
}
