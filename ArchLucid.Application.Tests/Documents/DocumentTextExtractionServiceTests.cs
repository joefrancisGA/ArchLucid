using ArchLucid.Application.Documents;

using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Documents;

[Trait("Category", "Unit")]
public sealed class DocumentTextExtractionServiceTests
{
  [Fact]
  public async Task ExtractAsync_docx_returns_normalized_text()
  {
    byte[] docxBytes = CreateDocxBytes("Microsoft Azure with PCI-DSS scope and a $25,000 monthly budget.");
    DocumentTextExtractionService sut = new(NullLogger<DocumentTextExtractionService>.Instance);
    IFormFile file = CreateFormFile("architecture-brief.docx", docxBytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    DocumentTextExtractionResult result = await sut.ExtractAsync(file, CancellationToken.None);

    result.Succeeded.Should().BeTrue();
    result.Text.Should().Contain("Microsoft Azure");
    result.Text.Should().Contain("PCI-DSS");
    result.CharacterCount.Should().Be(result.Text.Length);
  }

  [Fact]
  public async Task ExtractAsync_unsupported_extension_fails_validation()
  {
    DocumentTextExtractionService sut = new(NullLogger<DocumentTextExtractionService>.Instance);
    IFormFile file = CreateFormFile("notes.txt", "plain text"u8.ToArray(), "text/plain");

    DocumentTextExtractionResult result = await sut.ExtractAsync(file, CancellationToken.None);

    result.Succeeded.Should().BeFalse();
    result.FailureDetail.Should().Contain("Only PDF and DOCX");
  }

  private static IFormFile CreateFormFile(string fileName, byte[] content, string contentType)
  {
    Mock<IFormFile> file = new();
    MemoryStream stream = new(content);
    file.Setup(static f => f.FileName).Returns(fileName);
    file.Setup(static f => f.Length).Returns(content.LongLength);
    file.Setup(static f => f.ContentType).Returns(contentType);
    file.Setup(static f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
      .Returns<Stream, CancellationToken>((target, _) =>
      {
        stream.Position = 0;
        return stream.CopyToAsync(target);
      });

    return file.Object;
  }

  private static byte[] CreateDocxBytes(string bodyText)
  {
    using MemoryStream stream = new();
    using (WordprocessingDocument document = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document, true))
    {
      MainDocumentPart mainPart = document.AddMainDocumentPart();
      mainPart.Document = new Document(new Body(new Paragraph(new Run(new Text(bodyText)))));
      mainPart.Document.Save();
    }

    return stream.ToArray();
  }
}
