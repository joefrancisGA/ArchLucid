using FluentAssertions;

using UglyToad.PdfPig;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

/// <summary>
///     QuestPDF emits compressed content streams — dynamic English text is not reliably searchable as UTF-8 slices.
///     PDF coverage therefore validates wire shape (header, size, page geometry) and byte-level drift across materially different inputs;
///     DOCX golden tests carry authoritative heading-order parity.
/// </summary>
internal static class ArchitectureReviewBoardPdfTestHelpers
{
    internal static int CountPages(byte[] pdfBytes)
    {
        using MemoryStream ms = new(pdfBytes);
        using PdfDocument document = PdfDocument.Open(ms);

        return document.NumberOfPages;
    }

    internal static void AssertPdfWireBaseline(byte[] pdfBytes, int minimumPages = 2)
    {
        pdfBytes.Should().NotBeNull();
        pdfBytes.Length.Should().BeGreaterThan(400);
        pdfBytes.AsSpan(0, 5).SequenceEqual("%PDF-"u8).Should().BeTrue();

        CountPages(pdfBytes).Should().BeGreaterThanOrEqualTo(minimumPages);
    }
}
