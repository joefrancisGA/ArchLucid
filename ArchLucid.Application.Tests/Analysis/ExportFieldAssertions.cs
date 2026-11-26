using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

internal static class ExportFieldAssertions
{
    public static void MarkdownSection(string markdown, string heading, params string[] expectedRows) =>
        AssertFollowingRows(
            markdown.Split('\n', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries),
            heading,
            expectedRows);

    public static void DocxSection(byte[] docx, string heading, params string[] expectedRows)
    {
        using MemoryStream stream = new(docx);
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);
        string[] paragraphs = document.MainDocumentPart!.Document.Body!.Elements<Paragraph>()
            .Select(paragraph => paragraph.InnerText)
            .Where(text => !string.IsNullOrWhiteSpace(text))
            .ToArray();

        AssertFollowingRows(paragraphs, heading, expectedRows);
    }

    private static void AssertFollowingRows(string[] rows, string heading, string[] expectedRows)
    {
        int headingIndex = Array.IndexOf(rows, heading);
        headingIndex.Should().BeGreaterThanOrEqualTo(0, "the export should contain the heading {0}", heading);
        rows.Skip(headingIndex + 1).Take(expectedRows.Length)
            .Should().Equal(expectedRows, "these rows should appear directly under {0}", heading);
    }
}
