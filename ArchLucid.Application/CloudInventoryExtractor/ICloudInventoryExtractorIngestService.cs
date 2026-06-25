using ArchLucid.Contracts.Common;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.CloudInventoryExtractor;

public interface ICloudInventoryExtractorIngestService
{
    Task<CloudInventoryExtractorIngestResult> IngestZipAsync(
        CloudProvider cloudProvider,
        IFormFile? file,
        Guid? runId,
        CancellationToken cancellationToken,
        string? correlationId = null);
}
