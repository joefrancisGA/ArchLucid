namespace ArchLucid.Application.Architecture;

/// <summary>Normalizes and validates customer-visible architecture display names.</summary>
public static class ArchitectureIdentityDisplayNameRules
{
    public const string UntitledDisplayName = "Untitled architecture";

    public const int MaxDisplayNameLength = 200;

    public const int MaxDescriptionLength = 500;

    public static string NormalizeOrUntitled(string? displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
            return UntitledDisplayName;

        return TrimToMax(displayName, MaxDisplayNameLength);
    }

    public static string NormalizeRequired(string? displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
            throw new ArgumentException("DisplayName is required.", nameof(displayName));

        return TrimToMax(displayName, MaxDisplayNameLength);
    }

    public static string? NormalizeOptionalDescription(string? description)
    {
        if (string.IsNullOrWhiteSpace(description))
            return null;

        return TrimToMax(description, MaxDescriptionLength);
    }

    private static string TrimToMax(string value, int maxLength)
    {
        string trimmed = value.Trim();

        if (trimmed.Length <= maxLength)
            return trimmed;

        return trimmed[..maxLength];
    }
}
