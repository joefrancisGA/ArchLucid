using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.AzureExtractor;

public interface IAzureExtractorIngestService
{
    Task<AzureExtractorIngestResult> IngestZipAsync(IFormFile? file, Guid? runId, CancellationToken ct, string? correlationId = null);
}
