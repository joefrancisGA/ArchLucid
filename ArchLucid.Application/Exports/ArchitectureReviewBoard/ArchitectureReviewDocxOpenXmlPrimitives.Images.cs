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
using WpNonVisualGraphicFrameDrawingProperties =
    DocumentFormat.OpenXml.Drawing.Wordprocessing.NonVisualGraphicFrameDrawingProperties;
using WpParagraph = DocumentFormat.OpenXml.Wordprocessing.Paragraph;
using WpParagraphProperties = DocumentFormat.OpenXml.Wordprocessing.ParagraphProperties;
using WpRun = DocumentFormat.OpenXml.Wordprocessing.Run;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

internal static partial class ArchitectureReviewDocxOpenXmlPrimitives
{
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

    internal static void AddCenteredImageToBody(
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

        body.AppendChild(new WpParagraph(
            new WpParagraphProperties(new Justification { Val = JustificationValues.Center }),
            new WpRun(drawing)));
    }
}
