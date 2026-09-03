using ArchLucid.Contracts.Common;

using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Analysis;

internal static partial class ConsultingDocxSupplementalSections
{
    public static void AddDocumentControl(Body body, ArchitectureAnalysisReport report)
    {
        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Document Control", 1);

        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(
            body,
            "This document was generated from the ArchLucid analysis pipeline.",
            "BodyText");

        ConsultingDocxOpenXmlPrimitives.AddSpacer(body);

        ConsultingDocxOpenXmlPrimitives.AddKeyValueTable(body, [
            ("Document Type", "Architecture Analysis Report"),
            ("Run ID", report.Run.RunId),
            ("Request ID", report.Run.RequestId),
            ("Run Status", report.Run.Status.ToString()),
            ("Created UTC", report.Run.CreatedUtc.ToString("O")),
            ("Completed UTC", report.Run.CompletedUtc?.ToString("O") ?? "n/a"),
            ("Manifest Version", report.Run.CurrentManifestVersion ?? "n/a")
        ]);
    }

    public static void AddTableOfContentsPlaceholder(Body body)
    {
        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Table of Contents", 1);
        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(
            body,
            "Update fields in Word to refresh the table of contents.",
            "Subtle");

        ConsultingDocxOpenXmlPrimitives.AddSpacer(body);

        foreach (string item in new[]
                 {
                     "1. Sponsor report", "2. Architecture Overview", "3. Evidence and Constraints", "4. Architecture Details",
                     "5. Governance and Controls", "6. Explainability and Execution Review", "7. Conclusions", "Appendix A. Mermaid Source",
                     "Appendix B. Execution Trace Index", "Appendix C. Determinism and Comparison"
                 })

            ConsultingDocxOpenXmlPrimitives.AddBullet(body, item);
    }
}
