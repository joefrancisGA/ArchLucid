namespace ArchLucid.Contracts.Exports;

/// <summary>
///     Maps between <see cref="ExportProfileName" /> values and canonical profile tokens.
/// </summary>
public static class ExportProfileNameMappings
{
    /// <summary>Returns the canonical lowercase slug for <paramref name="profile" />.</summary>
    /// <exception cref="ArgumentOutOfRangeException">When <paramref name="profile" /> is not defined.</exception>
    public static string ToCanonicalToken(ExportProfileName profile) =>
        profile switch
        {
            ExportProfileName.ArchitectureReviewBoard => ArchitectureReviewBoardExportProfile.Token,
            _ => throw new ArgumentOutOfRangeException(nameof(profile), profile, "Unknown export profile.")
        };

    /// <summary>Parses a token emitted by APIs or persistence (case-insensitive).</summary>
    public static bool TryParseToken(string? token, out ExportProfileName profile)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            profile = default;

            return false;
        }

        if (string.Equals(token.Trim(), ArchitectureReviewBoardExportProfile.Token, StringComparison.OrdinalIgnoreCase))
        {
            profile = ExportProfileName.ArchitectureReviewBoard;

            return true;
        }

        profile = default;

        return false;
    }
}
