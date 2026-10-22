namespace ArchLucid.Contracts.User;

/// <summary>Stored values for personal Guided vs Working workspace mode.</summary>
public static class WorkspaceModeValues
{
    public const string Guided = "guided";

    public const string Working = "working";

    public const string Default = Working;

    public static string ParseOrDefault(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return Default;
        }

        string trimmed = value.Trim();

        if (string.Equals(trimmed, Working, StringComparison.OrdinalIgnoreCase))
        {
            return Working;
        }

        if (string.Equals(trimmed, Guided, StringComparison.OrdinalIgnoreCase))
        {
            return Guided;
        }

        return Default;
    }

    public static string Serialize(string mode)
    {
        return ParseOrDefault(mode);
    }

    public static bool IsExplicitValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string trimmed = value.Trim();

        return string.Equals(trimmed, Guided, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, Working, StringComparison.OrdinalIgnoreCase);
    }
}
