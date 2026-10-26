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

        string systemName = ConsultingDocxExportHonestyCopy.ResolveSystemName(report);

        string serviceCountToken = report.Manifest is null
            ? "Service count was not stored."
            : report.Manifest.Services.Count.ToString();
        string datastoreCountToken = report.Manifest is null
            ? "Datastore count was not stored."
            : report.Manifest.Datastores.Count.ToString();
        string controlCountToken = report.Manifest is null
            ? "Required control count was not stored."
            : report.Manifest.Governance.RequiredControls.Count.ToString();

        string text = options.SponsorReportTextTemplate
            .Replace("{SystemName}", systemName, StringComparison.OrdinalIgnoreCase)
            .Replace("{OrganizationName}", options.OrganizationName, StringComparison.OrdinalIgnoreCase)
            .Replace("{ServiceCount}", serviceCountToken, StringComparison.OrdinalIgnoreCase)
            .Replace("{DatastoreCount}", datastoreCountToken, StringComparison.OrdinalIgnoreCase)
            .Replace("{ControlCount}", controlCountToken, StringComparison.OrdinalIgnoreCase);

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
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(
                body,
                ConsultingDocxExportHonestyCopy.CommittedManifestNotStored,
                "BodyText");

            return;
        }

        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, options.ArchitectureOverviewIntro, "BodyText");

        if (string.IsNullOrWhiteSpace(report.Diagram))
        {
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(
                body,
                ConsultingDocxAppendixHonestyCopy.MermaidSourceNotStored,
                "BodyText");

            return;
        }

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
