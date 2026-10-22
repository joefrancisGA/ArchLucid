using System.Globalization;

namespace ArchLucid.Application.InfraEvidence.Branding;

/// <summary>WCAG 2.x contrast checks for tenant brand foreground/background pairs.</summary>
public static class TenantBrandContrastValidator
{
    public const double WcagAaMinimumContrastRatio = 4.5d;

    public static bool MeetsWcagAaMinimum(string? foregroundHex, string? backgroundHex)
    {
        if (!TryParseHexColor(foregroundHex, out double foregroundLuminance)
            || !TryParseHexColor(backgroundHex, out double backgroundLuminance))
        {
            return false;
        }

        double ratio = ComputeContrastRatio(foregroundLuminance, backgroundLuminance);

        return ratio >= WcagAaMinimumContrastRatio;
    }

    private static double ComputeContrastRatio(double luminanceA, double luminanceB)
    {
        double lighter = Math.Max(luminanceA, luminanceB);
        double darker = Math.Min(luminanceA, luminanceB);

        return (lighter + 0.05d) / (darker + 0.05d);
    }

    private static bool TryParseHexColor(string? raw, out double relativeLuminance)
    {
        relativeLuminance = 0d;

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        string trimmed = raw.Trim();

        if (trimmed.StartsWith('#'))
            trimmed = trimmed[1..];

        if (trimmed.Length is not (6 or 8))
            return false;

        if (!int.TryParse(trimmed[..6], NumberStyles.HexNumber, CultureInfo.InvariantCulture, out int rgb))
            return false;

        double red = ((rgb >> 16) & 0xFF) / 255d;
        double green = ((rgb >> 8) & 0xFF) / 255d;
        double blue = (rgb & 0xFF) / 255d;

        relativeLuminance = ComputeRelativeLuminance(red, green, blue);

        return true;
    }

    private static double ComputeRelativeLuminance(double red, double green, double blue)
    {
        static double Transform(double channel) =>
            channel <= 0.03928d
                ? channel / 12.92d
                : Math.Pow((channel + 0.055d) / 1.055d, 2.4d);

        return 0.2126d * Transform(red) + 0.7152d * Transform(green) + 0.0722d * Transform(blue);
    }
}
