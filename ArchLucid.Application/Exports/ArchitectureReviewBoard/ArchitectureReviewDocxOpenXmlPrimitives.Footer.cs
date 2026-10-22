using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

using WpParagraph = DocumentFormat.OpenXml.Wordprocessing.Paragraph;
using WpParagraphProperties = DocumentFormat.OpenXml.Wordprocessing.ParagraphProperties;
using WpRun = DocumentFormat.OpenXml.Wordprocessing.Run;
using WpRunProperties = DocumentFormat.OpenXml.Wordprocessing.RunProperties;
using WpText = DocumentFormat.OpenXml.Wordprocessing.Text;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

internal static partial class ArchitectureReviewDocxOpenXmlPrimitives
{
    /// <summary>Appends section properties with a default footer so Word repeats it on each page.</summary>
    internal static void AttachDefaultFooter(MainDocumentPart mainPart, Body body, string footerText)
    {
        ArgumentNullException.ThrowIfNull(footerText);

        FooterPart footerPart = mainPart.AddNewPart<FooterPart>();
        footerPart.Footer = new Footer(
            new WpParagraph(
                new WpParagraphProperties(
                    new Justification { Val = JustificationValues.Center }),
                new WpRun(
                    new WpRunProperties(new FontSize { Val = "18" }, new Color { Val = SubtleColorHex }),
                    new WpText(footerText) { Space = SpaceProcessingModeValues.Preserve })));
        footerPart.Footer.Save();

        string relationshipId = mainPart.GetIdOfPart(footerPart);

        SectionProperties sectionProps = new(
            new FooterReference { Type = HeaderFooterValues.Default, Id = relationshipId },
            new PageSize { Width = 12240U, Height = 15840U },
            new PageMargin { Top = 1440, Right = 1440, Bottom = 1440, Left = 1440, Header = 708U, Footer = 708U });

        body.AppendChild(sectionProps);
    }
}
