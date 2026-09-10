using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.Evidence;

public sealed partial class BulkEvidenceUploadService
{
    private async Task UploadExpandedZipEntriesAsync(
        ScopeContext scope,
        string actorUserId,
        Guid runId,
        IFormFile zipFile,
        string archiveName,
        Guid evidencePackageId,
        List<string> uploadedIds,
        List<string> fileNames,
        CancellationToken cancellationToken)
    {
        using Stream zipStream = zipFile.OpenReadStream();
        ZipEvidenceExpansionResult expansion = zipEvidenceExpanderService.Expand(zipStream, archiveName, evidencePackageId);

        foreach (ZipEvidenceExpandedFile expandedFile in expansion.Files)
        {
            using MemoryStream contentStream = new(expandedFile.Content);
            string contentType = ResolveUploadContentType(null);

            await UploadSingleEvidenceFileAsync(
                scope,
                actorUserId,
                runId,
                expandedFile.FileName,
                contentType,
                contentStream,
                uploadedIds,
                fileNames,
                cancellationToken);
        }
    }
}
