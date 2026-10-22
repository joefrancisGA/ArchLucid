using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.Documents;

/// <summary>Extracts plain text from advisory evidence uploads (PDF/DOCX) for intake prefill.</summary>
public interface IDocumentTextExtractionService
{
    Task<DocumentTextExtractionResult> ExtractAsync(IFormFile? file, CancellationToken cancellationToken);
}
