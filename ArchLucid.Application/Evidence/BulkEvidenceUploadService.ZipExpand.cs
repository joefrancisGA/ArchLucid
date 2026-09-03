using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.Evidence;

public sealed partial class BulkEvidenceUploadService
{
    private async Task UploadExpandedZipEntriesAsync(
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

            await UploadSingleEvidenceFileAsync(
                runId,
                expandedFile.FileName,
                contentStream,
                uploadedIds,
                fileNames,
                cancellationToken);
        }
    }
}
