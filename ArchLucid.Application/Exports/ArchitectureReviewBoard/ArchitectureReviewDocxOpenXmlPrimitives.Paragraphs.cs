using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Wordprocessing;

using WpBreak = DocumentFormat.OpenXml.Wordprocessing.Break;
using WpParagraph = DocumentFormat.OpenXml.Wordprocessing.Paragraph;
using WpParagraphProperties = DocumentFormat.OpenXml.Wordprocessing.ParagraphProperties;
using WpRun = DocumentFormat.OpenXml.Wordprocessing.Run;
using WpRunProperties = DocumentFormat.OpenXml.Wordprocessing.RunProperties;
using WpShading = DocumentFormat.OpenXml.Wordprocessing.Shading;
using WpSpacingBetweenLines = DocumentFormat.OpenXml.Wordprocessing.SpacingBetweenLines;
using WpText = DocumentFormat.OpenXml.Wordprocessing.Text;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

internal static partial class ArchitectureReviewDocxOpenXmlPrimitives
{
    internal static void AddStyledParagraph(Body body, string text, string styleId)
    {
        body.AppendChild(new WpParagraph(
            new WpParagraphProperties(
                new ParagraphStyleId { Val = styleId }),
            new WpRun(new WpText(text) { Space = SpaceProcessingModeValues.Preserve })));
    }

    internal static void AddCenteredStyledParagraph(Body body, string text, string styleId)
    {
        body.AppendChild(new WpParagraph(
            new WpParagraphProperties(
                new Justification { Val = JustificationValues.Center },
                new ParagraphStyleId { Val = styleId }),
            new WpRun(new WpText(text) { Space = SpaceProcessingModeValues.Preserve })));
    }

    internal static void AddHeading1(Body body, string text)
    {
        body.AppendChild(new WpParagraph(
            new WpParagraphProperties(
                new ParagraphStyleId { Val = "SectionHeading" }),
            new WpRun(new WpText(text) { Space = SpaceProcessingModeValues.Preserve })));
        AddSpacer(body);
    }

    internal static void AddBullet(Body body, string text)
    {
        body.AppendChild(new WpParagraph(
            new WpParagraphProperties(
                new SpacingBetweenLines { After = "40" }),
            new WpRun(new WpText($"• {text}") { Space = SpaceProcessingModeValues.Preserve })));
    }

    internal static void AddSpacer(Body body, int count = 1)
    {
        for (int i = 0; i < count; i++)
            body.AppendChild(new WpParagraph(new WpRun(new WpText(string.Empty))));
    }

    internal static void AddPageBreak(Body body)
    {
        body.AppendChild(new WpParagraph(
            new WpRun(new WpBreak { Type = BreakValues.Page })));
    }

    internal static void AddEmptyPlaceholder(Body body, string itemPhrase)
    {
        AddStyledParagraph(body, $"No {itemPhrase} recorded.", "Subtle");
        AddSpacer(body);
    }

    internal static void AddMultilineBodyText(Body body, string text)
    {
        foreach (string line in text.Replace("\r\n", "\n").Split('\n'))
        {
            string trimmed = line.TrimEnd();

            if (string.IsNullOrEmpty(trimmed))
                AddSpacer(body, 1);
            else
                AddStyledParagraph(body, trimmed, "BodyText");
        }

        AddSpacer(body);
    }

    internal static void AddCallout(Body body, string text)
    {
        WpParagraph paragraph = new(
            new WpParagraphProperties(
                new WpShading { Val = ShadingPatternValues.Clear, Fill = AccentFillHex },
                new WpSpacingBetweenLines { Before = "120", After = "120", Line = "280", LineRule = LineSpacingRuleValues.Auto }),
            new WpRun(
                new WpRunProperties(new Bold(), new Color { Val = SecondaryColorHex }),
                new WpText(text) { Space = SpaceProcessingModeValues.Preserve }));

        body.AppendChild(paragraph);
        AddSpacer(body);
    }
}
