namespace ArchLucid.Contracts.User;

/// <summary>Stored values for the first-login Training vs live-workspace choice.</summary>
public static class FirstSessionPurposeValues
{
    public const string Live = "live";

    public const string Training = "training";

    public static string? NormalizeOrNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        if (string.Equals(trimmed, Live, StringComparison.OrdinalIgnoreCase))
        {
            return Live;
        }

        if (string.Equals(trimmed, Training, StringComparison.OrdinalIgnoreCase))
        {
            return Training;
        }

        return null;
    }

    public static bool IsExplicitValue(string? value) => NormalizeOrNull(value) is not null;
}
