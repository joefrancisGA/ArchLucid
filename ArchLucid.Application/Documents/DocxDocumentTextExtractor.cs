using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Documents;

internal static class DocxDocumentTextExtractor
{
    internal static string Extract(ReadOnlySpan<byte> bytes)
    {
        using MemoryStream stream = new(bytes.ToArray());
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);
        Body? body = document.MainDocumentPart?.Document.Body;

        if (body is null)
        {
            return string.Empty;
        }

        IEnumerable<string> paragraphs = body
            .Descendants<Paragraph>()
            .Select(ExtractParagraphText)
            .Where(static paragraph => paragraph.Length > 0);

        return string.Join("\n", paragraphs);
    }

    private static string ExtractParagraphText(Paragraph paragraph)
    {
        return string.Concat(paragraph.Descendants<Text>().Select(static text => text.Text));
    }
}
