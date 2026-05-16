using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Drawing;
using DocumentFormat.OpenXml.Drawing.Wordprocessing;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

using DrBlip = DocumentFormat.OpenXml.Drawing.Blip;
using DrBlipFill = DocumentFormat.OpenXml.Drawing.Pictures.BlipFill;
using DrFillRectangle = DocumentFormat.OpenXml.Drawing.FillRectangle;
using DrGraphicFrameLocks = DocumentFormat.OpenXml.Drawing.GraphicFrameLocks;
using DrNonVisualDrawingProperties = DocumentFormat.OpenXml.Drawing.Pictures.NonVisualDrawingProperties;
using DrNonVisualPictureDrawingProperties = DocumentFormat.OpenXml.Drawing.Pictures.NonVisualPictureDrawingProperties;
using DrNonVisualPictureProperties = DocumentFormat.OpenXml.Drawing.Pictures.NonVisualPictureProperties;
using DrPicture = DocumentFormat.OpenXml.Drawing.Pictures.Picture;
using DrShapeProperties = DocumentFormat.OpenXml.Drawing.Pictures.ShapeProperties;
using DrStretch = DocumentFormat.OpenXml.Drawing.Stretch;
using WpBottomBorder = DocumentFormat.OpenXml.Wordprocessing.BottomBorder;
using WpBreak = DocumentFormat.OpenXml.Wordprocessing.Break;
using WpInsideHorizontalBorder = DocumentFormat.OpenXml.Wordprocessing.InsideHorizontalBorder;
using WpInsideVerticalBorder = DocumentFormat.OpenXml.Wordprocessing.InsideVerticalBorder;
using WpLeftBorder = DocumentFormat.OpenXml.Wordprocessing.LeftBorder;
using WpNonVisualGraphicFrameDrawingProperties =
    DocumentFormat.OpenXml.Drawing.Wordprocessing.NonVisualGraphicFrameDrawingProperties;
using WpParagraph = DocumentFormat.OpenXml.Wordprocessing.Paragraph;
using WpParagraphProperties = DocumentFormat.OpenXml.Wordprocessing.ParagraphProperties;
using WpRightBorder = DocumentFormat.OpenXml.Wordprocessing.RightBorder;
using WpRun = DocumentFormat.OpenXml.Wordprocessing.Run;
using WpRunProperties = DocumentFormat.OpenXml.Wordprocessing.RunProperties;
using WpShading = DocumentFormat.OpenXml.Wordprocessing.Shading;
using WpSpacingBetweenLines = DocumentFormat.OpenXml.Wordprocessing.SpacingBetweenLines;
using WpTable = DocumentFormat.OpenXml.Wordprocessing.Table;
using WpTableCell = DocumentFormat.OpenXml.Wordprocessing.TableCell;
using WpTableCellProperties = DocumentFormat.OpenXml.Wordprocessing.TableCellProperties;
using WpTableCellWidth = DocumentFormat.OpenXml.Wordprocessing.TableCellWidth;
using WpTableProperties = DocumentFormat.OpenXml.Wordprocessing.TableProperties;
using WpTableRow = DocumentFormat.OpenXml.Wordprocessing.TableRow;
using WpText = DocumentFormat.OpenXml.Wordprocessing.Text;
using WpTopBorder = DocumentFormat.OpenXml.Wordprocessing.TopBorder;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>OpenXML helpers for architecture review board DOCX export (styles, tables, footer binding).</summary>
internal static class ArchitectureReviewDocxOpenXmlPrimitives
{
    internal const string PrimaryColorHex = "1F497D";
    internal const string SecondaryColorHex = "4F6480";
    internal const string BodyColorHex = "2D3748";
    internal const string SubtleColorHex = "718096";
    internal const string AccentFillHex = "EDF2F7";

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

    internal static void AddStyledParagraph(Body body, string text, string styleId)
    {
        body.AppendChild(new WpParagraph(
            new WpParagraphProperties(
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

    internal static void AddKeyValueTable(Body body, IEnumerable<(string Key, string Value)> rows)
    {
        WpTable table = new();

        WpTableProperties props = new(
            new TableBorders(
                new WpTopBorder { Val = BorderValues.Single, Size = 8 },
                new WpBottomBorder { Val = BorderValues.Single, Size = 8 },
                new WpLeftBorder { Val = BorderValues.Single, Size = 8 },
                new WpRightBorder { Val = BorderValues.Single, Size = 8 },
                new WpInsideHorizontalBorder { Val = BorderValues.Single, Size = 6 },
                new WpInsideVerticalBorder { Val = BorderValues.Single, Size = 6 }),
            new TableWidth { Width = "9000", Type = TableWidthUnitValues.Dxa });

        table.AppendChild(props);

        foreach ((string key, string value) in rows)
        {
            WpTableRow tr = new();

            tr.Append(
                BuildCell(key, true, "2800"),
                BuildCell(value, false, "6200"));

            table.Append(tr);
        }

        body.AppendChild(table);
        AddSpacer(body);
    }

    private static WpTableCell BuildCell(string text, bool bold, string width)
    {
        WpRun run = new(new WpText(text) { Space = SpaceProcessingModeValues.Preserve });

        if (bold)
            run.RunProperties = new WpRunProperties(new Bold());

        return new WpTableCell(
            new WpTableCellProperties(
                new WpTableCellWidth { Type = TableWidthUnitValues.Dxa, Width = width }),
            new WpParagraph(
                new WpParagraphProperties(
                    new WpSpacingBetweenLines { Before = "80", After = "80" }),
                run));
    }

    internal static void AddImageToBody(
        MainDocumentPart mainPart,
        Body body,
        byte[] imageBytes,
        string imageName,
        long widthEmus,
        long heightEmus)
    {
        ArgumentNullException.ThrowIfNull(imageBytes);

        bool jpeg = imageBytes.Length >= 3 && imageBytes[0] == 0xFF && imageBytes[1] == 0xD8 && imageBytes[2] == 0xFF;

        ImagePart imagePart = jpeg
            ? mainPart.AddImagePart(ImagePartType.Jpeg)
            : mainPart.AddImagePart(ImagePartType.Png);

        using (MemoryStream ms = new(imageBytes))
            imagePart.FeedData(ms);

        string relationshipId = mainPart.GetIdOfPart(imagePart);

        Drawing drawing = new(
            new Inline(
                new Extent { Cx = widthEmus, Cy = heightEmus },
                new EffectExtent { LeftEdge = 0L, TopEdge = 0L, RightEdge = 0L, BottomEdge = 0L },
                new DocProperties { Id = 1U, Name = imageName },
                new WpNonVisualGraphicFrameDrawingProperties(
                    new DrGraphicFrameLocks { NoChangeAspect = true }),
                new Graphic(
                    new GraphicData(
                        new DrPicture(
                            new DrNonVisualPictureProperties(
                                new DrNonVisualDrawingProperties { Id = 0U, Name = imageName },
                                new DrNonVisualPictureDrawingProperties()),
                            new DrBlipFill(
                                new DrBlip { Embed = relationshipId },
                                new DrStretch(new DrFillRectangle())),
                            new DrShapeProperties(
                                new Transform2D(
                                    new Offset { X = 0L, Y = 0L },
                                    new Extents { Cx = widthEmus, Cy = heightEmus }),
                                new PresetGeometry(new AdjustValueList()) { Preset = ShapeTypeValues.Rectangle }))
                    ) { Uri = "http://schemas.openxmlformats.org/drawingml/2006/picture" }))
            {
                DistanceFromTop = 0U, DistanceFromBottom = 0U, DistanceFromLeft = 0U, DistanceFromRight = 0U
            });

        body.AppendChild(new WpParagraph(new WpRun(drawing)));
    }

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
