using UglyToad.PdfPig;

namespace ArchLucid.Application.Documents;

internal static class PdfDocumentTextExtractor
{
    internal static string Extract(ReadOnlySpan<byte> bytes)
    {
        using MemoryStream stream = new(bytes.ToArray());
        using PdfDocument document = PdfDocument.Open(stream);

        List<string> pageTexts = [];

        foreach (UglyToad.PdfPig.Content.Page page in document.GetPages())
        {
            string pageText = page.Text?.Trim() ?? string.Empty;

            if (pageText.Length > 0)
            {
                pageTexts.Add(pageText);
            }
        }

        return string.Join("\n\n", pageTexts);
    }
}
