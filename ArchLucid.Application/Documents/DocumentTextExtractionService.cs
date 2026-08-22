using System.Text;

using ArchLucid.Core.Diagnostics;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Documents;

public sealed class DocumentTextExtractionService(ILogger<DocumentTextExtractionService> logger)
    : IDocumentTextExtractionService
{
    private static readonly HashSet<string> SupportedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf",
        ".docx",
    };

    private readonly ILogger<DocumentTextExtractionService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<DocumentTextExtractionResult> ExtractAsync(IFormFile? file, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (file is null)
        {
            return DocumentTextExtractionResult.Fail("No file was uploaded (expected form field 'file').");
        }

        if (string.IsNullOrWhiteSpace(file.FileName))
        {
            return DocumentTextExtractionResult.Fail("Uploaded file must include a name with a .pdf or .docx extension.");
        }

        if (!TryResolveFormat(file.FileName, out string extension, out string contentType, out string? formatError))
        {
            return DocumentTextExtractionResult.Fail(formatError!);
        }

        if (file.Length <= 0)
        {
            return DocumentTextExtractionResult.Fail("Uploaded file is empty.");
        }

        if (file.Length > DocumentTextExtractionLimits.MaxUploadBytes)
        {
            return DocumentTextExtractionResult.Fail(
                $"File exceeds maximum size of {DocumentTextExtractionLimits.MaxUploadBytes} bytes.");
        }

        byte[] bytes;

        try
        {
            bytes = await ReadCappedAsync(file, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarningWithSanitizedUserArg(
                ex,
                "Failed to read evidence document {FileName} for text extraction.",
                file.FileName);

            return DocumentTextExtractionResult.Fail("Could not read uploaded file.");
        }

        string extractedText;

        try
        {
            extractedText = extension switch
            {
                ".pdf" => PdfDocumentTextExtractor.Extract(bytes),
                ".docx" => DocxDocumentTextExtractor.Extract(bytes),
                _ => string.Empty,
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarningWithSanitizedUserArg(
                ex,
                "Failed to extract text from evidence document {FileName}.",
                file.FileName);

            return DocumentTextExtractionResult.Fail("Could not extract text from the uploaded document.");
        }

        string normalizedText = NormalizeExtractedText(extractedText);

        if (normalizedText.Length == 0)
        {
            return DocumentTextExtractionResult.Fail("No extractable text was found in the uploaded document.");
        }

        bool truncated = false;

        if (normalizedText.Length > DocumentTextExtractionLimits.MaxOutputCharacters)
        {
            normalizedText = normalizedText[..DocumentTextExtractionLimits.MaxOutputCharacters];
            truncated = true;
        }

        return new DocumentTextExtractionResult
        {
            Succeeded = true,
            FileName = file.FileName,
            ContentType = contentType,
            Text = normalizedText,
            CharacterCount = normalizedText.Length,
            Truncated = truncated,
        };
    }

    private static bool TryResolveFormat(
        string fileName,
        out string extension,
        out string contentType,
        out string? formatError)
    {
        extension = Path.GetExtension(fileName);

        if (!SupportedExtensions.Contains(extension))
        {
            contentType = string.Empty;
            formatError = "Only PDF and DOCX files are supported for text extraction.";

            return false;
        }

        contentType = extension.Equals(".pdf", StringComparison.OrdinalIgnoreCase)
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        formatError = null;

        return true;
    }

    private static async Task<byte[]> ReadCappedAsync(IFormFile file, CancellationToken cancellationToken)
    {
        await using MemoryStream buffer = new();

        await file.CopyToAsync(buffer, cancellationToken);

        if (buffer.Length > DocumentTextExtractionLimits.MaxUploadBytes)
        {
            throw new InvalidOperationException("Uploaded file exceeds the extraction size cap.");
        }

        return buffer.ToArray();
    }

    private static string NormalizeExtractedText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        StringBuilder builder = new(text.Length);
        bool previousWasWhitespace = false;

        foreach (char character in text)
        {
            if (char.IsWhiteSpace(character))
            {
                if (!previousWasWhitespace)
                {
                    builder.Append(' ');
                    previousWasWhitespace = true;
                }

                continue;
            }

            builder.Append(character);
            previousWasWhitespace = false;
        }

        return builder.ToString().Trim();
    }
}
