using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

/// <summary>
///     DOCX assertions for architecture-review-board exports (Open XML paragraph styles).
/// </summary>
internal static class ArchitectureReviewBoardDocxTestHelpers
{
    /// <summary>
    ///     Section bodies use <c>SectionHeading</c> style — nine headings after the cover page.
    /// </summary>
    internal static IReadOnlyList<string> ExtractSectionHeadingsInOrder(byte[] docxBytes)
    {
        using MemoryStream ms = new(docxBytes);
        using WordprocessingDocument doc = WordprocessingDocument.Open(ms, false);
        Body? body = doc.MainDocumentPart?.Document.Body;

        if (body is null)
            return [];

        List<string> headings = [];

        foreach (Paragraph para in body.Descendants<Paragraph>())
        {
            string? styleId = para.ParagraphProperties?.ParagraphStyleId?.Val?.Value;

            if (styleId != "SectionHeading")
                continue;

            string text = string.Concat(para.Descendants<Text>().Select(static t => t.Text));

            if (text.Length > 0)
                headings.Add(text);
        }

        return headings;
    }

    internal static string ExtractMainDocumentXml(byte[] docxBytes)
    {
        using MemoryStream ms = new(docxBytes);
        using WordprocessingDocument doc = WordprocessingDocument.Open(ms, false);

        return doc.MainDocumentPart!.Document.Body!.OuterXml;
    }

    internal static int CountImageParts(byte[] docxBytes)
    {
        using MemoryStream ms = new(docxBytes);
        using WordprocessingDocument doc = WordprocessingDocument.Open(ms, false);

        return doc.MainDocumentPart?.ImageParts.Count() ?? 0;
    }
}
