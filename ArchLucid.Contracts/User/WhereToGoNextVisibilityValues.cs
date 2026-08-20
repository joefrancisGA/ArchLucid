namespace ArchLucid.Contracts.User;

/// <summary>Stored values for personal Where to go next follow-up visibility.</summary>
public static class WhereToGoNextVisibilityValues
{
    public const string True = "true";

    public const string False = "false";

    public const string Default = True;

    public static bool ParseOrDefault(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        string trimmed = value.Trim();

        if (string.Equals(trimmed, True, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.Equals(trimmed, False, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return true;
    }

    public static string Serialize(bool enabled)
    {
        return enabled ? True : False;
    }
}
