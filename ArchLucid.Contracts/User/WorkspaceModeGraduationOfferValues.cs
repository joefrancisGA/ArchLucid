namespace ArchLucid.Contracts.User;

/// <summary>Stored values for the post-seal Working-mode graduation offer.</summary>
public static class WorkspaceModeGraduationOfferValues
{
    public const string Pending = "pending";

    public const string Dismissed = "dismissed";

    public const string RemindNext = "remind-next";

    public const string Default = Pending;

    public static string ParseOrDefault(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return Default;
        }

        string trimmed = value.Trim();

        if (string.Equals(trimmed, Dismissed, StringComparison.OrdinalIgnoreCase))
        {
            return Dismissed;
        }

        if (string.Equals(trimmed, RemindNext, StringComparison.OrdinalIgnoreCase))
        {
            return RemindNext;
        }

        if (string.Equals(trimmed, Pending, StringComparison.OrdinalIgnoreCase))
        {
            return Pending;
        }

        return Default;
    }

    public static string Serialize(string state)
    {
        return ParseOrDefault(state);
    }

    public static bool IsExplicitValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string trimmed = value.Trim();

        return string.Equals(trimmed, Pending, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, Dismissed, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, RemindNext, StringComparison.OrdinalIgnoreCase);
    }
}
