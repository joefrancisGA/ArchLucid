namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>
///     Validates consultant logo payloads embedded into architecture-review-board exports (DOCX/PDF).
/// </summary>
public static class ArchitectureReviewBoardCoverLogoValidator
{
    /// <summary>Maximum decoded logo payload size (2&nbsp;MB).</summary>
    public const int MaxLogoBytes = 2 * 1024 * 1024;

    /// <summary>
    ///     Ensures <paramref name="logoBytes" /> is PNG or JPEG by magic bytes and within size limits.
    /// </summary>
    /// <exception cref="ArgumentException">When MIME validation fails or the payload exceeds <see cref="MaxLogoBytes" />.</exception>
    public static void ValidateLogo(byte[] logoBytes)
    {
        ArgumentNullException.ThrowIfNull(logoBytes);

        if (logoBytes.Length == 0)
            throw new ArgumentException("Logo payload is empty.", nameof(logoBytes));

        if (logoBytes.Length > MaxLogoBytes)
            throw new ArgumentException($"Logo exceeds maximum size of {MaxLogoBytes} bytes.", nameof(logoBytes));

        bool jpeg = logoBytes.Length >= 3 && logoBytes[0] == 0xFF && logoBytes[1] == 0xD8 && logoBytes[2] == 0xFF;

        bool png = logoBytes.Length >= 8 && logoBytes[0] == 0x89 && logoBytes[1] == 0x50 && logoBytes[2] == 0x4E &&
                   logoBytes[3] == 0x47 && logoBytes[4] == 0x0D && logoBytes[5] == 0x0A && logoBytes[6] == 0x1A &&
                   logoBytes[7] == 0x0A;

        if (!jpeg && !png)
            throw new ArgumentException("Logo must be PNG or JPEG (validated via magic bytes).", nameof(logoBytes));
    }

    /// <summary>
    ///     Validates non-null payloads only (<see langword="null" /> skips validation).
    /// </summary>
    public static void ValidateLogoOptional(byte[]? logoBytes)
    {
        if (logoBytes is null)
            return;

        ValidateLogo(logoBytes);
    }
}
