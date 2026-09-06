using ArchLucid.Application.Exports;

using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Analysis;

internal static partial class ConsultingDocxSupplementalSections
{
    public static void AddCareerExportHonesty(Body body, CareerExportCoverageHonestyInput? careerExportHonesty)
    {
        ArgumentNullException.ThrowIfNull(body);

        if (careerExportHonesty is null)
        {
            return;
        }

        string plainText = CareerExportCoverageHonestyComposer.FormatPlainText(careerExportHonesty).Trim();

        if (plainText.Length == 0)
        {
            return;
        }

        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Career export honesty", 1);
        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, plainText, "BodyText");
        ConsultingDocxOpenXmlPrimitives.AddSpacer(body, 2);
    }
}
