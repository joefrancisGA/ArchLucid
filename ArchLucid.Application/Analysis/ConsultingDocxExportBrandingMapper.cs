namespace ArchLucid.Application.Analysis;

/// <summary>Parses optional consulting-export branding fields supplied by HTTP callers.</summary>
public static class ConsultingDocxExportBrandingMapper
{
    private const int MaxDecodedLogoBytes = 512 * 1024;

    /// <summary>
    ///     Builds branding when any field is provided; returns <see langword="null" /> when all inputs are blank.
    ///     Sets <paramref name="errorMessage"/> when logo base64 is invalid or oversized.
    /// </summary>
    public static ConsultingDocxExportBranding? TryCreate(
        string? firmDisplayName,
        string? engagementTitle,
        string? logoBase64Payload,
        out string? errorMessage)
    {
        errorMessage = null;
        string? firm = string.IsNullOrWhiteSpace(firmDisplayName) ? null : firmDisplayName.Trim();
        string? engagement = string.IsNullOrWhiteSpace(engagementTitle) ? null : engagementTitle.Trim();

        byte[]? logoBytes = null;

        if (!string.IsNullOrWhiteSpace(logoBase64Payload))
        {
            string trimmed = logoBase64Payload.Trim();

            if (trimmed.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                int comma = trimmed.IndexOf(',', StringComparison.Ordinal);

                if (comma >= 0)
                    trimmed = trimmed[(comma + 1)..];
            }

            trimmed = trimmed.Replace("\r", string.Empty, StringComparison.Ordinal)
                .Replace("\n", string.Empty, StringComparison.Ordinal)
                .Replace(" ", string.Empty, StringComparison.Ordinal);

            try
            {
                logoBytes = Convert.FromBase64String(trimmed);
            }
            catch (FormatException)
            {
                errorMessage = "ReviewBoardWhitelabelLogoBase64 is not valid base64.";
                return null;
            }

            if (logoBytes.Length > MaxDecodedLogoBytes)
            {
                errorMessage = $"Decoded logo exceeds {MaxDecodedLogoBytes} bytes.";
                return null;
            }
        }

        if (firm is null && engagement is null && logoBytes is null)
            return null;

        return new ConsultingDocxExportBranding(firm, engagement, logoBytes);
    }

    /// <summary>Rebuilds human-visible branding from a persisted audit row (logo bytes are not recoverable).</summary>
    public static ConsultingDocxExportBranding? FromPersistedHints(PersistedAnalysisExportRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        string? firm = string.IsNullOrWhiteSpace(request.ReviewBoardWhitelabelFirmDisplayName)
            ? null
            : request.ReviewBoardWhitelabelFirmDisplayName.Trim();

        string? engagement = string.IsNullOrWhiteSpace(request.ReviewBoardWhitelabelClientEngagementTitle)
            ? null
            : request.ReviewBoardWhitelabelClientEngagementTitle.Trim();

        if (firm is null && engagement is null)
            return null;

        return new ConsultingDocxExportBranding(firm, engagement, null);
    }
}
