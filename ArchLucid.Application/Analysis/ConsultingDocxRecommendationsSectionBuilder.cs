using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Analysis;

internal static class ConsultingDocxRecommendationsSectionBuilder
{
    public static void Add(Body body, ArchitectureAnalysisReport report, ConsultingDocxTemplateOptions options)
    {
        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Conclusions", 1);

        string conclusions = report.Manifest is null
            ? ConsultingDocxExportHonestyCopy.ConclusionsWithoutManifest
            : options.ConclusionsText;

        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, conclusions, "BodyText");

        if (report.Warnings.Count <= 0)
            return;

        ConsultingDocxOpenXmlPrimitives.AddSpacer(body);
        ConsultingDocxOpenXmlPrimitives.AddCallout(body,
            "Open warnings remain and should be resolved or explicitly accepted.", options);
    }
}
