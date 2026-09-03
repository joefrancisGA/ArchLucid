using ArchLucid.Contracts.Common;
using ArchLucid.Core.Diagrams;

using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Analysis;

internal static partial class ConsultingDocxSupplementalSections
{
    public static void AddSponsorReport(
        Body body,
        ArchitectureAnalysisReport report,
        ConsultingDocxTemplateOptions options)
    {
        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Sponsor report", 1);

        string systemName = report.Manifest?.SystemName
                            ?? report.Evidence?.SystemName
                            ?? "the requested system";

        int serviceCount = report.Manifest?.Services.Count ?? 0;
        int datastoreCount = report.Manifest?.Datastores.Count ?? 0;
        int controlCount = report.Manifest?.Governance.RequiredControls.Count ?? 0;

        string text = options.SponsorReportTextTemplate
            .Replace("{SystemName}", systemName, StringComparison.OrdinalIgnoreCase)
            .Replace("{OrganizationName}", options.OrganizationName, StringComparison.OrdinalIgnoreCase)
            .Replace("{ServiceCount}", serviceCount.ToString(), StringComparison.OrdinalIgnoreCase)
            .Replace("{DatastoreCount}", datastoreCount.ToString(), StringComparison.OrdinalIgnoreCase)
            .Replace("{ControlCount}", controlCount.ToString(), StringComparison.OrdinalIgnoreCase);

        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, text, "BodyText");

        if (report.Warnings.Count > 0)

            ConsultingDocxOpenXmlPrimitives.AddCallout(
                body,
                "Key warnings were identified during analysis and should be reviewed before approval.",
                options);
    }

    public static async Task AddArchitectureOverviewAsync(
        Body body,
        MainDocumentPart mainPart,
        ArchitectureAnalysisReport report,
        ConsultingDocxTemplateOptions options,
        IDiagramImageRenderer diagramImageRenderer,
        CancellationToken cancellationToken)
    {
        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Architecture Overview", 1);

        if (report.Manifest is null)
        {
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, "No manifest was available for this run.",
                "BodyText");

            return;
        }

        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, options.ArchitectureOverviewIntro, "BodyText");

        if (string.IsNullOrWhiteSpace(report.Diagram))
            return;

        byte[]? imageBytes = await diagramImageRenderer.RenderMermaidPngAsync(
            report.Diagram,
            cancellationToken);

        if (imageBytes is not null && imageBytes.Length > 0)

            ConsultingDocxOpenXmlPrimitives.AddImageToBody(
                mainPart,
                body,
                imageBytes,
                "Architecture Overview Diagram",
                6_200_000L,
                3_600_000L);

        else

            ConsultingDocxOpenXmlPrimitives.AddCallout(
                body,
                "Diagram image rendering was unavailable. Mermaid source is included in Appendix A.",
                options);
    }
}
