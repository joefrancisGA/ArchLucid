using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

internal static partial class ArchitectureReviewDocxOpenXmlPrimitives
{
    internal static void AddStylesPart(MainDocumentPart mainPart)
    {
        StyleDefinitionsPart stylePart = mainPart.StyleDefinitionsPart ?? mainPart.AddNewPart<StyleDefinitionsPart>();
        stylePart.Styles = new Styles(
            BuildParagraphStyle("DocTitle", "Title", PrimaryColorHex, "72", true),
            BuildParagraphStyle("DocSubtitle", "Subtitle", SecondaryColorHex, "48"),
            BuildParagraphStyle("SectionHeading", "Section Heading", PrimaryColorHex, "36", true),
            BuildParagraphStyle("BodyText", "Body Text", BodyColorHex, "24"),
            BuildParagraphStyle("Subtle", "Subtle", SubtleColorHex, "22"),
            BuildParagraphStyle("Callout", "Callout", BodyColorHex, "22"));
        stylePart.Styles.Save();
    }

    private static Style BuildParagraphStyle(
        string styleId,
        string styleName,
        string colorHex,
        string fontSizeHalfPoints,
        bool bold = false)
    {
        Style style = new() { Type = StyleValues.Paragraph, StyleId = styleId, CustomStyle = true };
        style.Append(new StyleName { Val = styleName });
        style.Append(new BasedOn { Val = "Normal" });
        style.Append(new UIPriority { Val = 1 });
        style.Append(new PrimaryStyle());

        StyleRunProperties runProps = new(
            new Color { Val = colorHex },
            new FontSize { Val = fontSizeHalfPoints });

        if (bold)
            runProps.Append(new Bold());

        style.Append(new StyleParagraphProperties(
            new SpacingBetweenLines { Before = "120", After = "120", Line = "300", LineRule = LineSpacingRuleValues.Auto }));

        style.Append(runProps);

        return style;
    }
}
