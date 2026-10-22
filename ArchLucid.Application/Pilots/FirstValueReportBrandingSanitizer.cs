using System.Globalization;
using System.Text;

namespace ArchLucid.Application.Pilots;

/// <summary>Constrains persisted tenant-supplied branding for first-value Markdown/PDF to benign printable text.</summary>
public static class FirstValueReportBrandingSanitizer
{
    internal const int MaxCompanyNameChars = 200;

    /// <summary>Returns sanitized fields; drops values that violate basic safety rules.</summary>
    public static TenantFirstValueReportBrandingForExport? TryBuildExportModel(string? rawLogoUrl, string? rawCompanyName)
    {
        string? logo = SanitizeHttpsUrl(rawLogoUrl);
        string? company = SanitizeCompanyName(rawCompanyName);
        return logo is null && company is null ? null : new TenantFirstValueReportBrandingForExport(company, logo);
    }

    private static string? SanitizeHttpsUrl(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        ReadOnlySpan<char> s = raw.AsSpan().Trim();
        if (s.Length > 2048 || s.Length == 0)
            return null;

        if (!Uri.TryCreate(s.ToString(), UriKind.Absolute, out Uri? uri))
            return null;

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            return null;

        return uri.GetComponents(UriComponents.AbsoluteUri, UriFormat.UriEscaped);
    }

    private static string? SanitizeCompanyName(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        string trimmed = raw.Trim();
        string normalized = trimmed.Normalize(NormalizationForm.FormKC);
        if (normalized.Length > MaxCompanyNameChars)
            normalized = normalized[..MaxCompanyNameChars];

        Span<char> buffer = normalized.Length <= 512 ? stackalloc char[normalized.Length] : new char[normalized.Length];
        int w = 0;

        foreach (char c in normalized)
        {
            if (char.IsControl(c))
                continue;

            if (c is '<' or '>')
                continue;

            buffer[w++] = c;
        }

        if (w is 0)
            return null;

        string cleaned = buffer[..w].ToString().Trim();
        return cleaned.Length == 0 ? null : cleaned;
    }
}
