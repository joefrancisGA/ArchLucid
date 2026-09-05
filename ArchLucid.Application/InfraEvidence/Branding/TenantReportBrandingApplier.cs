using System.Text;

using QuestPDF.Fluent;
using QuestPDF.Helpers;

namespace ArchLucid.Application.InfraEvidence.Branding;

/// <summary>Format-specific apply methods for <see cref="TenantReportBrandingForExport"/>.</summary>
public static class TenantReportBrandingApplier
{
    public const string LogoChecksumMarkerPrefix = "branding-logo-sha256:";

    public static void AppendFirstValueReportMarkdownPreamble(
        StringBuilder sb,
        TenantReportBrandingForExport? branding)
    {
        if (branding is null)
            return;

        if (!string.IsNullOrWhiteSpace(branding.CompanyDisplayName))
        {
            sb.AppendLine($"> Prepared for: {branding.CompanyDisplayName}");
            sb.AppendLine();
        }

        if (!string.IsNullOrWhiteSpace(branding.Tagline))
        {
            sb.AppendLine($"> {branding.Tagline}");
            sb.AppendLine();
        }

        if (!string.IsNullOrWhiteSpace(branding.LogoHttpsUrl))
        {
            sb.AppendLine($"![Tenant logo]({branding.LogoHttpsUrl})");
            sb.AppendLine();
        }

        if (!string.IsNullOrWhiteSpace(branding.SupportUrl))
        {
            sb.AppendLine($"> Support: {branding.SupportUrl}");
            sb.AppendLine();
        }
    }

    public static void ApplyFirstValueReportPdfHeader(
        ColumnDescriptor header,
        TenantReportBrandingForExport? branding,
        bool showSponsorCirculationWatermark,
        string watermarkBannerText)
    {
        if (showSponsorCirculationWatermark)
        {
            header.Item()
                .Background(Colors.Red.Lighten4)
                .Padding(6)
                .Text(watermarkBannerText)
                .Bold()
                .FontColor(Colors.Red.Darken3)
                .FontSize(11);
        }

        if (!string.IsNullOrWhiteSpace(branding?.CompanyDisplayName))
        {
            header.Item()
                .PaddingBottom(4)
                .Text(branding.CompanyDisplayName)
                .Bold()
                .FontSize(12);
        }

        if (!string.IsNullOrWhiteSpace(branding?.Tagline))
        {
            header.Item()
                .PaddingBottom(4)
                .Text(branding.Tagline)
                .Italic()
                .FontSize(10);
        }

        header.Item().Text("ArchLucid — first value report (pilot)").Bold().FontSize(14);

        if (branding?.ShowPoweredByArchLucid == true)
        {
            header.Item()
                .PaddingTop(2)
                .Text("Powered by ArchLucid")
                .FontSize(9)
                .FontColor(Colors.Grey.Medium);
        }
    }

    public static void ApplyFirstValueReportPdfFooter(
        ColumnDescriptor footer,
        TenantReportBrandingForExport? branding,
        string runId,
        bool showSponsorCirculationWatermark,
        string watermarkBannerText)
    {
        if (showSponsorCirculationWatermark)
            footer.Item().AlignCenter().Text(watermarkBannerText).FontSize(9).Italic().FontColor(Colors.Grey.Medium);

        footer.Item().AlignCenter().Text(text =>
        {
            text.Span("Generated from run ");
            text.Span(runId).Bold();
        });

        if (!string.IsNullOrWhiteSpace(branding?.LogoChecksumSha256Hex))
        {
            footer.Item()
                .AlignCenter()
                .Text($"{LogoChecksumMarkerPrefix}{branding.LogoChecksumSha256Hex}")
                .FontSize(1)
                .FontColor(Colors.White);
        }
    }
}
