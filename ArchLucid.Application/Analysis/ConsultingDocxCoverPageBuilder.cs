using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Analysis;

internal static class ConsultingDocxCoverPageBuilder
{
    public static async Task AddAsync(
        MainDocumentPart mainPart,
        Body body,
        ArchitectureAnalysisReport report,
        ConsultingDocxTemplateOptions options,
        IDocumentLogoProvider logoProvider,
        ConsultingDocxExportBranding? branding,
        CancellationToken cancellationToken)
    {
        byte[]? brandingLogoBytes = branding?.LogoBytes;

        if (brandingLogoBytes is { Length: > 0 })
        {
            ConsultingDocxOpenXmlPrimitives.AddImageToBody(mainPart, body, brandingLogoBytes, "Review board logo",
                2_200_000L,
                700_000L);
            ConsultingDocxOpenXmlPrimitives.AddSpacer(body, 2);
        }
        else if (options.IncludeLogo)
        {
            byte[]? logoBytes = await logoProvider.GetLogoBytesAsync(options, cancellationToken);

            if (logoBytes is not null && logoBytes.Length > 0)
            {
                ConsultingDocxOpenXmlPrimitives.AddImageToBody(mainPart, body, logoBytes, "Document Logo", 2_200_000L,
                    700_000L);
                ConsultingDocxOpenXmlPrimitives.AddSpacer(body, 2);
            }
        }

        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, options.DocumentTitle, "Title");

        string? firmLabel = branding?.FirmDisplayName?.Trim();

        if (!string.IsNullOrWhiteSpace(firmLabel))
        {
            ConsultingDocxOpenXmlPrimitives.AddSpacer(body, 1);
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, firmLabel!, "Subtitle");
        }

        string? engagementLabel = branding?.EngagementTitle?.Trim();

        if (!string.IsNullOrWhiteSpace(engagementLabel))
        {
            ConsultingDocxOpenXmlPrimitives.AddSpacer(body, 1);
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, engagementLabel!, "BodyText");
        }

        string systemName = report.Evidence?.SystemName
                            ?? report.Manifest?.SystemName
                            ?? "Architecture Run";

        string subtitle = options.SubtitleFormat
            .Replace("{SystemName}", systemName, StringComparison.OrdinalIgnoreCase)
            .Replace("{RunId}", report.Run.RunId, StringComparison.OrdinalIgnoreCase)
            .Replace("{OrganizationName}", options.OrganizationName, StringComparison.OrdinalIgnoreCase);

        ConsultingDocxOpenXmlPrimitives.AddSpacer(body, 2);
        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, subtitle, "Subtitle");
        ConsultingDocxOpenXmlPrimitives.AddSpacer(body, 2);

        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, $"Run ID: {report.Run.RunId}", "BodyText");
        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, $"Request ID: {report.Run.RequestId}", "BodyText");
        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, $"Generated UTC: {TimeProvider.System.UtcNowDateTime():O}", "BodyText");

        if (!string.IsNullOrWhiteSpace(report.Run.CurrentManifestVersion))

            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(
                body,
                $"Manifest Version: {report.Run.CurrentManifestVersion}",
                "BodyText");

        ConsultingDocxOpenXmlPrimitives.AddSpacer(body, 6);
        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, options.GeneratedByLine, "Subtle");
    }
}
